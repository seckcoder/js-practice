(function() {
    var NS = WeiboVis;
    crawl_num_per_page = 200;
    WeiboVis.appkey = null;
    WeiboVis.access_token = "2.00Kij3FD0X4mszcb910f3a6e00NSLk";
    var api_calling_queue = [];
    var api_current_waiting = 0;
    WeiboVis.add('api-status');

    var api_queue_proceed = function() {
        WeiboVis.set('api-status', {
            queue_length: api_calling_queue.length,
            calling: api_current_waiting
        });
        if (api_calling_queue.length == 0) return;
        if (api_current_waiting >= 10) return;
        var f = api_calling_queue[0];
        api_calling_queue = api_calling_queue.slice(1);
        api_current_waiting++;
        f(function() {
            api_current_waiting--;
        });
    };
    WeiboVis.getAPI = function(url, data, callback, onfail) {
        if (WeiboVis.appkey)
            data.source = WeiboVis.appkey;
        else if(WeiboVis.access_token)
            data.access_token = WeiboVis.access_token;

        var call_function = function(next) {
            $.ajax({
                url: "https://api.weibo.com/2/" + url + ".json",
                dataType: 'jsonp',
                data: data,
                timeout: 10000
            }).done(function(data) {
                next();
                api_queue_proceed();
                if(callback) callback(data);
            }).fail(function() {
                next();
                api_queue_proceed();
                if(onfail) onfail();
            });
        };
        api_calling_queue.push(call_function);
        api_queue_proceed();
    };
    WeiboVis.getRepostTree = function(root_mid, param) {
        if(!param) param = {};
        var on_progress = param.progress ? param.progress : function() {};
        var on_finished = param.finished ? param.finished : function() {};
        var on_root_get = param.get_root ? param.get_root : function(status, next) { next(); };
        var depth_limit = param.depth_limit ? param.depth_limit : 4;
        var repost_limit = param.repost_limit ? param.repost_limit : 2;
        var page_limit = param.page_limit ? param.page_limit : 10;
        var status_count = 0;
        var result = {};
        var action_count = 0;
        var action_finished = 0;
        var action_failed = 0;
        var should_cancel = false;  // whether we should stop the crawl
        var weibo_id = null;
        var fail_message = function(msg, err) {
            on_progress({status:"failed", message: msg, code: err});
        }
        var add_weibo = function(status, depth) {
            if (status.user == null || result[status.id]) return false;
            status_count++;
            result[status.id] = {
                reposts_count: status.reposts_count,
                depth: depth,
                user: {
                    screen_name: status.user.screen_name,
                    province: status.user.province,
                    gender: status.user.gender,
                    verified: status.user.verified,
                    verified_type: status.user.verified_type,
                    followers_count: status.user.followers_count,
                    friends_count : status.user.friends_count,
                    statuses_count: status.user.statuses_count,
                    profile_image_url: status.user.profile_image_url,
                    url: status.user.url,
                    created_at: status.user.created_at
                }
            };
            return true;
        }
        var add_children = function(root_id, children_ids) {
            if (result[root_id]) {
                result[root_id].children = children_ids;
            }
        }
        var finish = function() {
            if(on_finished) on_finished(result, weibo_id);
        };
        WeiboVis.getAPI("account/rate_limit_status", { }, function(r) {
            rate_limit = Math.min(r.data.remaining_ip_hits, r.data.remaining_user_hits);
            WeiboVis.getAPI("statuses/queryid", {mid: root_mid, type:1, isBase62: 1}, function(r) {
                weibo_id = r.data.id;
                WeiboVis.getAPI("statuses/show", {id: weibo_id}, function(r) {
                    if(r.code == 0) {
                        fail_message("root", r.data? r.data.error_code : null);
                        return;
                    }
                    on_root_get(r.data, function() {
                        add_weibo(r.data, 0);
                    })
                    var fetch_subtree = function(root, depth, pagenum) {
                        if(!pagenum) {
                            pagenum = Math.ceil(result[root].reposts_count/crawl_num_per_page);
                            pagenum = Math.min(pagenum, page_limit);
                        }
                        for(var page = 1; page <= pagenum; page++) {
                            if (action_count >= rate_limit) break;
                            if (should_cancel) break;
                            action_count++;
                            WeiboVis.getAPI("statuses/repost_timeline", {
                                id: root,
                                page: page,
                                count: crawl_num_per_page
                            }, function(r) {
                                if (should_cancel) return;
                                var repost_ids = [];
                                for(var i in r.data.reposts) {
                                    var status = r.data.reposts[i];
                                    if(add_weibo(status, depth)) {
                                        ids.push(status.id);
                                    }
                                }
                                repost_ids.sort(function(a, b) {
                                    return result[b].reposts_count - result[a].reposts_count;
                                });
                                add_children(status.id, repost_ids);
                                if(depth < depth_limit) {
                                    for(var i = 0; i < repost_ids.length; i++) {
                                        if(result[[repost_ids[i]]].reposts_count >= repost_limit)
                                            fetch_subtree(repost_ids[i], depth+1);
                                    }
                                }
                                action_finished++;
                            }, function() { action_failed++; action_finished++; }
                            );
                        }
                    };
                    fetch_subtree(weibo_id, 1);
                    var tm = setInterval(function() {
                        if(action_finished >= action_count || should_cancel) {
                            clearInterval(tm);
                            try {
                                finish();
                            } catch(e) {}
                        } else {
                            if(on_progress) {
                                on_progress({
                                    status: "progress",
                                    action_count: action_count,
                                    action_finished: action_finished,
                                    action_failed: action_failed,
                                    rate_limit : rate_limit,
                                    status_count : status_count,
                                })
                            }
                        }
                    }, 100);
                }, function() {fail_message("rate");});
            }, function() {fail_message("rate");});
        }, function() {fail_message("rate");})
    };
})();
