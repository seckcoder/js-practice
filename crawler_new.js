// Jike Weibo Crawler
var jike = jike || {};

(function () {
    jike.crawler = jike.crawler || {};
    var NS = jike.crawler;
    NS.appkey = null;
    NS.access_token = "2.001svOGDXBRcBEe533b988f8SIux1E";
    NS.root_mid = "z5szZsV8a";

    // Values and Events
    NS_values = { };
    NS_events = { };
    var value_event_prefix = "__value:";
    NS.addValue = function(key, type, initial) {
        if (initial === undefined || initial === null) {
            if (type == "bool") initial = false;
            if (type == "string") initial = "";
            if (type == "number") initial = 0;
            if (type == "object") initial = { };
        }
        NS_values[key] = {
            type: type,
            value: initial
        };
        NS.addEvent(value_event_prefix + key);
        return NS;
    };
    NS.add = NS.addValue;

    NS.setValue = function(key, value, post_event) {
        NS_values[key].value = value;
        if (post_event === null || post_event === undefined || post_event === true){
            NS.raiseEvent(value_event_prefix + key, value);
        }
        return NS;
    };
    NS.set = NS.setValue;
    NS.getValue = function(key) {
        return NS_value[key].value;
    };
    NS.get = NS.getValue;

    NS.addListener = function(key, listener, priority) {
        priority = priority ? priority : 1;
        var ev = NS_events[key];
        ev.listeners.push({ f: listener, p : priority});
        ev.listeners.sort(function(a, b) {
            return b.p - a.p;
        });
        return NS;
    }

    NS.on = NS.addListener;

    NS.addValueListener = function(key, listener, priority) {
        return NS.addListener(value_event_prefix + key, listener, priority);
    };
    NS.listen = NS.addValueListener;

    NS.addEvent = function(key) {
        NS_events[key] = {
            listeners : [],
            running : false
        };
        return NS;
    };
    NS.raiseEvent = function(key, param) {
        var ev = NS_events[key];
        if(ev.running) return NS;
        ev.running = true;
        for(var i in ev.listeners) {
            var r;
            try {
                r = ev.listeners[i].f(parameters);
            } catch(e) {
            }
            if(r) break;
        }
        ev.running = false;
        return NS;
    };
    NS.raise = NS.raiseEvent;

    // Helper Methods
    NS.incf = function(k, v) {
        var incfv = v ? v : 1;
        if (this[k] === undefined) this[k] = 0;
        this[k] += incfv;
    };
    NS.getDefault = function(v, defv) {
        return (v === undefined) ? defv: v;
    };

    // Sina Api
    var api_calling_queue = [];
    var api_current_waiting = 0;
    NS.add('api-status');

    var api_queue_proceed = function() {
        NS.set('api-status', {
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
    NS.getAPI = function(url, data, callback, onfail) {
        if (NS.appkey)
            data.source = NS.appkey;
        else if(NS.access_token)
            data.access_token = NS.access_token;

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
    NS.getRepostTree = function(root_mid, param) {
        if(!param) param = {};
        var on_progress = NS.getDefault(param.progress, function() {});
        var on_finished = NS.getDefault(param.finished, function() {});
        var on_root_get = NS.getDefault(param.get_root, function(status, next) { next(); });
        var depth_limit = NS.getDefault(param.depth_limit, 4);
        var max_repost_num  = NS.getDefault(param.max_repost_num, 100000);
        var crawl_nrepost_per_page = NS.getDefault(param.crawl_nrepost_per_page, 200);
        var crawl_ncomment_per_page = NS.getDefault(param.crawl_ncomment_per_page, 100);
        var cal_repost_page_limit = function() {
            return Math.ceil(max_repost_num / crawl_nrepost_per_page);
        };
        var cal_comment_page_limit = function() {
            return Math.ceil(max_repost_num / crawl_ncomment_per_page);
        };
        var repost_page_limit = param.repost_page_limit ? param.repost_page_limit : cal_repost_page_limit();
        var comment_page_limit = param.comment_page_limit ? param.comment_page_limit : cal_comment_page_limit();
        var status_count = 0;
        var visited_num = {};
        visited_num.incf = NS.incf;
        var action_count = 0;
        var action_finished = 0;
        var action_failed = 0;
        var should_cancel = false;  // whether we should stop the crawl


        // Return data
        var weibos = {};   // the root post and reposts for the root post
        var comments = []; // comments of the root post
        var weibo_id = null;
        var original_user_info = {};

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
        };
        var add_weibo = function(status, depth, parent_id) {
            if (status.user == null) return false;
            NS.incf.call(visited_num, status.id);
            if (visited_num[status.id] > depth_limit) return false;
            if (!weibos[status.id]) status_count++;

            weibos[status.id] = {
                reposts_count: status.reposts_count,
                comments_count: status.comments_count,
                depth: depth,
                parent: parent_id,
                text: status.text,
                id: status.id,
                user: fetch_user_info(status)
            };
            return true;
        }
        /*var add_childrens = function(root_id, children_ids) {
          if (weibos[root_id]) {
          if (weibos[root_id].children === undefined)
          weibos[root_id].children = children_ids;
          else {
          weibos[root_id].children = weibos[root_id].children.concat(children_ids);
          }
          }
          }*/
        var add_comments = function(root_id, cmts) {
            for(var i = 0; i < cmts.length; i++) {
                if (cmts[i].user !== null) {
                    comments.push({
                        id: cmts[i].id,
                        user: fetch_user_info(cmts[i])
                    })
                }
            }
            return true;
        }
        var finish = function() {
            if(on_finished) on_finished({"weibos": weibos,
                                        "comments" : comments,
                                        "original_user_info" : original_user_info},
                                        weibo_id);
        };
        NS.getAPI("account/rate_limit_status", { }, function(r) {
            rate_limit = Math.min(r.data.remaining_ip_hits, r.data.remaining_user_hits);
            NS.getAPI("statuses/queryid", {mid: root_mid, type:1, isBase62: 1}, function(r) {
                weibo_id = r.data.id;
                NS.getAPI("statuses/show", {id: weibo_id}, function(r) {
                    if(r.code == 0) {
                        fail_message("root", r.data? r.data.error_code : null);
                        return;
                    }
                    var total_repost_num = r.data.reposts_count;
                    on_root_get(r.data, function() {
                        add_weibo(r.data, 0);
                        original_user_info = {
                            name: r.data.user.screen_name,
                            avatar_url: r.data.user.avatar_large,
                            content: r.data.text,
                            source_url: "http://weibo.com/" + r.data.user.id + "/" + root_mid,
                            time: (new Date(r.data.created_at)).getTime(),
                            repost_count: r.data.reposts_count,
                            comment_count: r.data.comments_count,
                            user_url: "http://weibo.com/u/" + r.data.user.id,
                        };
                    });
                    var cal_page_num = function(total_num, num_per_page, repost_page_limit) {
                        return Math.min(Math.ceil(total_num / num_per_page), repost_page_limit);
                    };
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
                            NS.getAPI("comments/show", {
                                id: root,
                                page: page,
                                count: crawl_ncomment_per_page
                            }, function(r) {
                                add_comments(root, r.data.comments);
                                action_finished++;
                            }, function() { action_failed++; action_finished++;});
                        }
                    };
                    var cal_repost_limit = function() {
                        if (total_repost_num <= 1000) return 2;
                        else return Math.ceil(Math.log(total_repost_num));
                    };
                    var repost_limit = NS.getDefault(param.repost_limit, cal_repost_limit());
                    //console.log(repost_limit + " " + repost_page_limit + " " + comment_page_limit);
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
                            NS.getAPI("statuses/repost_timeline", {
                                id: root,
                                page: page,
                                count: crawl_nrepost_per_page
                            }, function(r) {
                                action_finished++;
                                if (should_cancel) return;
                                var repost_ids = [];
                                for(var i =0; i < r.data.reposts.length; i++) {
                                    var status = r.data.reposts[i];
                                    //if (depth == 2) console.log(status.user.screen_name + " " + status.user.id);
                                    //if (depth == 1 && status.user.id == "2827699110") console.log("fuck");
                                    if(add_weibo(status, depth, root)) {
                                        repost_ids.push(status.id);
                                    }
                                }
                                /*repost_ids.sort(function(a, b) {
                                  return weibos[b].reposts_count - weibos[a].reposts_count;
                                  });*/
                                //add_childrens(root, repost_ids);
                                if(depth < depth_limit) {
                                    for(var i = 0; i < repost_ids.length; i++) {
                                        if(weibos[repost_ids[i]].reposts_count >= repost_limit)
                                            fetch_subtree(repost_ids[i], depth+1);
                                    }
                                }
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
                }, function() {fail_message("亲，现在访问量过大，请稍后再试吧~~");});  // out of rate
            }, function() {fail_message("亲，现在访问量过大，请稍后再试吧~~");});  // out of rate
        }, function() {fail_message("亲，现在访问量过大，请稍后再试吧~~");})  // out of rate
    };


    // Crawler starter
    NS.startCrawl = function (/**/) {
        reply = NS.crawlRepostTimeLine({
            depth_limit: 4,   // max recurse depth
            max_repost_num: 100000,   // max number of reposts we will crawl
            crawl_nrepost_per_page : 200,   // number of repost in one page (Get from sina)
            crawl_ncomment_per_page : 100,  // number of comments in one page (Get from  sina)
            // set the following when you really want.
            //repost_limit: 10,   // least number of reposts to recurse 
            //repost_page_limit: 500,
            //comment_page_limit: 1000,
        });
    };

    NS.crawlRepostTimeLine = function (config) {
        var crawl_finished = false;
        var progress_object = {};
        var param = Object.create(config);
        var province_map = {};
        var tidy = function(root, data) {
            var tidy_util = {
                day_diff : function(d1, d2) {return Math.ceil((d1 - d2) / (24*60*60*1000))},
                statuses_daily_count : function(user) {
                    var today = new Date();
                    return user.statuses_count / tidy_util.day_diff(today, new Date(user.created_at));
                },
                is_active_user : function(user) {
                    if(user.statuses_count >= 15 &&
                       user.followers_count >= 15 && tidy_util.statuses_daily_count(user) > 0.2) {
                        return true;
                    }
                    return false;
                },
                cal_worth :  function(user) {
                    var w = 1;
                    var extra_worth = 0;
                    if (user.verified_type == 0 || user.verified_type == 2)  
                        extra_worth = 1;
                    else if(user.verified_type >= 200)
                        extra_worth = 0.5;
                    return (Math.log(user.followers_count) + w * Math.log(user.statuses_count) + 
                            extra_worth) * tidy_util.statuses_daily_count(user);
                },
            };
            var weibos = data.weibos;
            var comments = data.comments;
            var original_user_info = data.original_user_info;
            original_user_info.value = tidy_util.cal_worth(weibos[root].user);
            var result = {};
            var cal_children = function() {
                for (var weibo_id in weibos) {
                    if (weibos[weibo_id].parent) {
                        if (weibos[weibos[weibo_id].parent].children)
                            weibos[weibos[weibo_id].parent].children.push(weibo_id);
                        else
                            weibos[weibos[weibo_id].parent].children = [weibo_id];
                    }
                }
            };
            cal_children();
            var get_d3js_data = function() {
                var weibo_visited = {};   // in case of sina has done some stupic things
                var user_visited = {};   // erase the repetitive repost
                var dfs = function(root) {
                    if (weibo_visited[root]) {
                        console.log("Something rediculous has happend. Fuck sina!!!!");
                        return {};
                    }
                    weibo_visited[root] = true;
                    user_visited[weibos[root].user.id] = true;
                    var node = {}
                    node.name = weibos[root].user.screen_name;
                    node.text = weibos[root].text;
                    if (!weibos[root].children) {
                        node.size = 1;
                        return node;
                    } else {
                        node.children = [];
                        for(var i = 0; i < weibos[root].children.length; i++) {
                            var children = weibos[root].children[i];
                            if (!user_visited[weibos[children].user.id])
                                node.children.push(dfs(children));
                        }
                        return node;
                    }
                }
                return dfs(root);
            };
            result["d3js_data"] = get_d3js_data();
            var get_repost_user_info = function(d3js_data) {
                var repost_user_info = {};
                var repost_users = {};
                for (var weibo_id in weibos) {
                    repost_users[weibos[weibo_id].user.id] = weibos[weibo_id].user;
                }
                var get_region_ratio = function() {
                    var region_counts = {};
                    for(var user_id in repost_users) {
                        NS.incf.call(region_counts, repost_users[user_id].province);
                    }
                    var region_counts_sortable = [];
                    for(var province_id in region_counts) {
                        region_counts_sortable.push({name: province_map[province_id],
                                                    value: region_counts[province_id]});
                    }
                    region_counts_sortable.sort(function(va, vb) {
                        return vb.value - va.value;
                    });
                    return region_counts_sortable;
                };
                var get_gender_ratio = function() {
                    var gender_counts = {};
                    for(var user_id in repost_users) {
                        NS.incf.call(gender_counts, repost_users[user_id].gender);
                    }
                    var total = gender_counts["m"] + gender_counts["f"];
                    return [gender_counts["m"] / total, gender_counts["f"] / total];
                };
                var get_repost_level = function(d3js_data) {
                    var repost_level = {
                        name: ["一级", "二级", "三级", "四级以上"],
                        data: [0, 0, 0, 0],
                    };
                    var dfs = function(level, root_node) {
                        var level_idx = Math.min(level, repost_level.data.length - 1);
                        if(root_node.children === undefined) return;
                        repost_level.data[level_idx] += root_node.children.length;
                        for(var i = 0; i < root_node.children.length; i++) {
                            dfs(level + 1, root_node.children[i]);
                        }
                    };
                    dfs(0, d3js_data);
                    return repost_level;
                };
                var get_verified_type = function() {
                    var verified_type = [];
                    var total_num_users = 0;
                    var user_identity = ["普通用户", "个人认证", "企业认证", "微博达人"];
                    for(var n in user_identity) {
                        verified_type.push({name: n, value: 0});
                    }
                    for(var user_id in repost_users) {
                        total_num_users += 1;
                        if(repost_users[user_id].verified_type == 0)
                            verified_type[1].value += 1;
                        else if(repost_users[user_id].verified_type == 2)
                            verified_type[2].value += 1;
                        else if (repost_users[user_id].verified_type >= 200)
                            verified_type[3].value += 1;
                        else
                            verified_type[0].value += 1;
                    }
                    for(var i = 0; i < user_identity.length; i++) {
                        verified_type[i].value /= total_num_users;
                    }
                    return verified_type;
                };
                var get_repost_active_ratio = function() {
                    var active_num_users = 0;
                    var total_num_users = 0;
                    for(var user_id in repost_users) {
                        total_num_users += 1;
                        if (tidy_util.is_active_user(repost_users[user_id])) active_num_users += 1;
                    }
                    return {percentage: active_num_users / total_num_users};
                };
                var get_repost_time_cluster = function() {
                    var repost_time_cluster = [];
                    for(var weibo_id in weibos) {
                        repost_time_cluster.push([(new Date(weibos[weibo_id].created_at)).getTime(), 1]);
                    }
                    repost_time_cluster.sort(function(va, vb) {
                        return va[0] - vb[0];
                    });
                    return repost_time_cluster;
                };
                repost_user_info.region_ratio = get_region_ratio();
                repost_user_info.gender_ratio = get_gender_ratio();
                repost_user_info.repost_level = get_repost_level(d3js_data);
                repost_user_info.verified_type = get_verified_type();
                repost_user_info.repost_active_ratio = get_repost_active_ratio();
                repost_user_info.repost_time_cluster = get_repost_time_cluster();
                return repost_user_info;
            };
            result["repost_user_info"] = get_repost_user_info(result["d3js_data"]);
            var get_rank = function() {
                var user_tweet_info = {};
                var user_format = function(user) {
                    var cal_activate = function() {
                        var get_tweet_score = function() {
                            var score_table = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110];
                            var lookup_table = [4,  5,  6,  7,  8,  9,  10, 11, 20, 30, 40, 50, 60, 70];
                            for(var i = 0; i < lookup_table.length; i++) {
                                if (daily_tweet_freq < lookup_table[i]) {
                                    return score_table[i];
                                }
                            }
                            return score_table[score_table.length - 1];
                        };
                        var daily_tweet_freq = tidy_util.statuses_daily_count(user);
                        var activate = 0;
                        if(daily_tweet_freq >= 4.0) activate += get_tweet_score();
                        else activate += daily_tweet_freq * 10;

                        if (user.verified_type >= 200) activate += 5;

                        return activate;
                    };
                    return {
                        repost_count: 0,
                        comment_count: 0,
                        name: user.screen_name,
                        worth: tidy_util.cal_worth(user),
                        activate: cal_activate(),
                        fans_count: user.followers_count,
                        idol_count: user.friends_count,
                        thumb_url: user.profile_image_url,
                        user_url: user.url
                    };
                };

                for(var weibo_id in weibos) {
                    var user_id = weibos[weibo_id].user.id;
                    if (!user_tweet_info[user_id])
                        user_tweet_info[user_id] = user_format(weibos[weibo_id].user);
                    user_tweet_info[user_id].repost_count += 1;
                }
                for(var cmt_id in comments) {
                    var user_id = comments[cmt_id].user.id;
                    if (!user_tweet_info[user_id])
                        user_tweet_info[user_id] = user_format(comments[cmt_id].user);
                    user_tweet_info[user_id].comment_count += 1;
                }
                var user_tweet_info_sortable = [];
                for(var user_id in user_tweet_info) {
                    user_tweet_info_sortable.push(user_tweet_info[user_id]);
                };
                var repost_rank = $.extend(true, [], user_tweet_info_sortable),
                comment_rank = $.extend(true, [], user_tweet_info_sortable);
                repost_rank.sort(function(va, vb) {
                    return vb.repost_count - va.repost_count;
                });
                comment_rank.sort(function(va, vb) {
                    return vb.comment_count - va.comment_count;
                });
                return [{rank: "total_reposts",
                    users: repost_rank},
                    {rank:"total_comments",
                        users: comment_rank}];
            };
            result["rank"] = get_rank();
            result["original_user_info"] = original_user_info;
            result["status"] = 0;
            result["msg"] = "成功";
            //return result;
            console.log(result);
        };
        param.finished = function(data, root_id) {
            $.ajax({
                url: "/json/province.json",
                dataType: 'json',
                jsonp: 'jsoncallback',
            }).done(function(prov_data) {
                for (var i = 0; i < prov_data.provinces.length; i++) {
                    var prov_id=prov_data.provinces[i].id,
                    prov_name=prov_data.provinces[i].name;
                    province_map[prov_id] = prov_name;
                }
                tidy(root_id, data);
            }).fail(function() {
                console.log("Server busy");
            });
            crawl_finished = true;
        };
        param.progress = function(info) {
            if (info.status == "failed") {
                jike.weibo.util.addErrorEffect(info.msg);
            } else if(info.status == "progress") {
                progress_object.action_count = info.action_count;
                progress_object.action_finished = info.action_finished;
                progress_object.action_failed = info.action_failed;
                progress_object.rate_limit = info.rate_limit;
                progress_object.status_count = info.status_count;
                progress_object.action_total_width = 400;
                progress_object.action_done_width = info.action_finished / info.action_count * 400;
            }
        };
        param.get_root = function(status, next) {next();};
        NS.getRepostTree(NS.root_mid, param);
        var counter = 0;
        var timer = setInterval(function() {
            // TODO : put progressbar here
            console.log("action_count: " + progress_object.action_count +
                        " action_finished: " + progress_object.action_finished +
                        " action_failed: " + progress_object.action_failed +
                        " rate_limit: " + progress_object.rate_limit +
                        " status_count: " + progress_object.status_count);
            counter += 1;
            if (crawl_finished) {
                clearInterval(timer);
                console.log("action_count: " + progress_object.action_count +
                            " action_finished: " + progress_object.action_finished +
                            " action_failed: " + progress_object.action_failed +
                            " rate_limit: " + progress_object.rate_limit +
                            " status_count: " + progress_object.status_count);
                console.log("finished in " + counter/10 + " seconds");
            }
        }, 100);
    };
})();
