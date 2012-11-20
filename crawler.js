// Copyright 2012 jike Inc. All Rights Reserved.
// Author: liwei@jike.com (Li Wei)

//WeiboVis.root_mid = "z5l2cBPhG"  // a great number of reposts http://weibo.com/1889213710/z5l2cBPhG
//WeiboVis.root_mid = "z5kHslftu"    // demo for many number of reposts
//WeiboVis.root_mid = "z5szZsV8a"  // some number of reposts http://weibo.com/1847982423/z5szZsV8a
WeiboVis.root_mid = "z5hq12bGP"   // demo for small number of reposts

//WeiboVis.uid = "1197161814"
WeiboVis.appkey = null;
WeiboVis.access_token = "2.001svOGDXBRcBEe533b988f8SIux1E";

function startCrawl(/**/) {
    reply = crawlRepostTimeLine({
        //uid: WeiboVis.uid,
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

function crawlRepostTimeLine(config) {

    var crawl_finished = false;
    var progress_object = {};
    var province_map = {};
    var tidy = function(root, data) {
        var weibos = data.weibos;
        var comments = data.comments;
        var result = {};
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
        };

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
                    WeiboVis.incf.call(region_counts, repost_users[user_id].province);
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
                    WeiboVis.incf.call(gender_counts, repost_users[user_id].gender);
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
                var cal_worth = function() {
                    var w = 1;
                    var extra_worth = 0;
                    if (user.verified_type == 0 || user.verified_type == 2)  
                        extra_worth = 1;
                    else if(user.verified_type >= 200)
                        extra_worth = 0.5;
                    return (Math.log(user.followers_count) + w * Math.log(user.statuses_count) + 
                        extra_worth) * tidy_util.statuses_daily_count(user);
                };
                var cal_activate = function() {
                    return 75;
                };
                return {
                    repost_count: 0,
                    comment_count: 0,
                    name: user.screen_name,
                    worth: cal_worth(),
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
            var repost_rank = user_tweet_info_sortable,
                comment_rank = user_tweet_info_sortable;
            repost_rank.sort(function(va, vb) {
                return vb.repost_count - va.repost_count;
            });
            comment_rank.sort(function(va, vb) {
                return vb.comment_count - va.comment_count;
            });
            console.log(repost_rank);
            console.log("------------------");
            console.log(comment_rank);
            return [{rank: "total_reposts",
                     users: repost_rank},
                     {rank:"total_comments",
                     users: comment_rank}];
        };
        result["rank"] = get_rank();
        //return result;
        console.log(result);
    };
    var param = Object.create(config);
    param.finished = function(data, root_id) {
        //console.log({"root": root_id, "data": data});
        $.ajax({
            url: "http://127.0.0.1/json/province.json",
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
            // TODO : add failure handler 
            console.log("failed");
            //return;
        } else if(info.status == "progress") {
            //console.log("progress");
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
    WeiboVis.getRepostTree(WeiboVis.root_mid, param);
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
