(function() {
    var NS = WeiboVis;
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
        var repost_page_limit = param.repost_page_limit ? param.repost_page_limit : 10;
        var comment_page_limit = param.comment_page_limit ? param.comment_page_limit : 10;
        var crawl_nrepost_per_page = param.crawl_nrepost_per_page ? param.crawl_nrepost_per_page : 100;
        var crawl_ncomment_per_page = param.crawl_ncomment_per_page ? param.crawl_ncomment_per_page : 100;
        var status_count = 0;
        var weibos = {};   // the root post and reposts for the root post
        var comments = []; // comments of the root post
        var visited_num = {};
        var action_count = 0;
        var action_finished = 0;
        var action_failed = 0;
        var should_cancel = false;  // whether we should stop the crawl
        var weibo_id = null;
        var fail_message = function(msg, err) {
            on_progress({status:"failed", message: msg, code: err});
        }
        var fetch_user_info = function(status) {
            return {
                id: status.user.id,
                screen_name: status.user.screen_name,
                province: status.user.province,
                gender: status.user.gender,
                verified: status.user.verified,
                verified_type: status.user.verified_type,
                followers_count: status.user.followers_count,
                friends_count : status.user.friends_count,
                statuses_count: status.user.statuses_count,
                profile_image_url: status.user.profile_image_url,
                url: "http://weibo.com/u/" + status.user.id,
                created_at: status.user.created_at
            }
        }
        var add_weibo = function(status, depth) {
            if (status.user == null) return false;
            if (visited_num[status.id] === undefined) {
                visited_num[status.id] = 1;
            } else {
                visited_num[status.id]++;
            }
            if (visited_num[status.id] > depth_limit) return false;
            if (!weibos[status.id]) status_count++;

            weibos[status.id] = {
                reposts_count: status.reposts_count,
                comments_count: status.comments_count,
                depth: depth,
                user: fetch_user_info(status)
            };
            return true;
        }
        var add_childrens = function(root_id, children_ids) {
            if (weibos[root_id]) {
                if (weibos[root_id].children === undefined)
                    weibos[root_id].children = children_ids;
                else {
                    weibos[root_id].children = weibos[root_id].children.concat(children_ids);
                }
            }
        }
        var add_comments = function(root_id, cmts) {
            for(var i = 0; i < cmts.length; i++) {
                if (cmts[i].user !== null) {
                    comments.push({
                        user: fetch_user_info(cmts[i])
                    })
                }
            }
            return true;
        }
        var finish = function() {
            if(on_finished) on_finished({"weibos": weibos, "comments" : comments}, weibo_id);
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
                    var cal_page_num = function(total_num, num_per_page, repost_page_limit) {
                        return Math.min(Math.ceil(total_num / num_per_page), repost_page_limit);
                    }
                    var fetch_comments = function(root, pagenum) {
                        if(!pagenum) {
                            pagenum = cal_page_num(weibos[root].comments_count,
                                                   crawl_ncomment_per_page,
                                                   comment_page_limit);
                        }
                        for(var page = 1; page <= pagenum; page++) {
                            if (action_count >= rate_limit) break;
                            if (should_cancel) break;
                            action_count++;
                            WeiboVis.getAPI("comments/show", {
                                id: root,
                                page: page,
                                count: crawl_ncomment_per_page
                            }, function(r) {
                                add_comments(root, r.data.comments);
                                action_finished++;
                            }, function() { action_failed++; action_finished++;});
                        }
                    };
                    var fetch_subtree = function(root, depth, pagenum) {
                        if(!pagenum) {
                            pagenum = cal_page_num(weibos[root].reposts_count,
                                                   crawl_nrepost_per_page, 
                                                   repost_page_limit);
                        }
                        for(var page = 1; page <= pagenum; page++) {
                            if (action_count >= rate_limit) break;
                            if (should_cancel) break;
                            action_count++;
                            WeiboVis.getAPI("statuses/repost_timeline", {
                                id: root,
                                page: page,
                                count: crawl_nrepost_per_page
                            }, function(r) {
                                if (should_cancel) return;
                                var repost_ids = [];
                                for(var i =0; i < r.data.reposts.length; i++) {
                                    var status = r.data.reposts[i];
                                    //if (depth == 2) console.log(status.user.screen_name + " " + status.user.id);
                                    //if (depth == 1 && status.user.id == "2827699110") console.log("fuck");
                                    if(add_weibo(status, depth)) {
                                        repost_ids.push(status.id);
                                    }
                                }
                                /*repost_ids.sort(function(a, b) {
                                    return weibos[b].reposts_count - weibos[a].reposts_count;
                                });*/
                                add_childrens(root, repost_ids);
                                if(depth < depth_limit) {
                                    for(var i = 0; i < repost_ids.length; i++) {
                                        if(weibos[repost_ids[i]].reposts_count >= repost_limit)
                                            fetch_subtree(repost_ids[i], depth+1);
                                    }
                                }
                                action_finished++;
                            }, function() { action_failed++; action_finished++; }
                            );
                        }
                    };
                    fetch_comments(weibo_id);
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
