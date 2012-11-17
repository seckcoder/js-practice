// Copyright 2012 jike Inc. All Rights Reserved.
// Author: liwei@jike.com (Li Wei)

//WeiboVis.root_mid = "z5l2cBPhG"  // a great number of reposts http://weibo.com/1889213710/z5l2cBPhG
//WeiboVis.root_mid = "z5kHslftu"    // demo for many number of reposts
WeiboVis.root_mid = "z5szZsV8a"  // some number of reposts http://weibo.com/1847982423/z5szZsV8a
//WeiboVis.root_mid = "z5hq12bGP"   // demo for small number of reposts

WeiboVis.uid = "1197161814"
WeiboVis.appkey = null;
WeiboVis.access_token = "2.00Kij3FD0X4mszcb910f3a6e00NSLk";

function startCrawl(/**/) {
    reply = crawlRepostTimeLine({
        uid: WeiboVis.uid,
        depth_limit: 4,
        repost_limit: 2,
        crawl_nrepost_per_page : 200,
        crawl_ncomment_per_page : 100,
        repost_page_limit: 50,
        comment_page_limit: 100,
    });
}
function test_api (/**/) {
    WeiboVis.getAPI("statuses/queryid", {mid: WeiboVis.root_mid, type:1, isBase62: 1}, function(r) {
        weibo_id = r.data.id
        console.log(r.data);
        WeiboVis.getAPI("comments/show", {id: weibo_id, page:1, count:1}, function(r) {
            console.log(r.data);
            WeiboVis.getAPI("statuses/repost_timeline", {id: weibo_id, page:1, count:1}, function(r) {
                console.log(r.data);
            });
        });
    });
}
function crawlRepostTimeLine(config) {
    var tidy = function(root, data) {
        var weibos = data.weibos;
        var comments = data.comments;
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
        var get_repost_user_info = function() {
            var repost_user_info = {};
            var repost_users = {};
            for (var weibo_id in weibos) {
                repost_users[weibos[weibo_id].user.id] = weibos[weibo_id].user;
            }
            var get_region_ratio = function() {
                var region_counts = {};
                for(var user_id in repost_users) {
                    WeiboVis.incf.call(region_counts, user_id);
                }
                var region_counts_sortable = [];
                for(var province in region_counts) {
                    region_counts_sortable.push({ name: province, value: region_counts[province]});
                }
                region_counts_sortable.sort(function(va, vb) {
                    return vb.value - va.value;
                });
            };
            var get_gender_ratio = function() {
                var gender_counts = {};
                for(var user_id in repost_users) {
                    WeiboVis.incf.call(gender_counts, repost_users[user_id].gender);
                }
                var total = gender_counts["m"] + gender_counts["f"];
                return {0: gender_counts["m"] / total, 1: gender_counts["f"] / total};
            };
        };
        result["repost_user_info"] = get_repost_user_info();
    }
    var crawl_finished = false;
    var progress_object = {};
    var param = Object.create(config);
    param.finished = function(data, root_id) {
        //tidy(root_id, data);
        //console.log(data);
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
    var timer = setInterval(function() {
        // TODO : put progressbar here
        console.log("action_count: " + progress_object.action_count +
                    " action_finished: " + progress_object.action_finished +
                    " action_failed: " + progress_object.action_failed +
                    " rate_limit: " + progress_object.rate_limit +
                    " status_count: " + progress_object.status_count);
        if (crawl_finished) {
            clearInterval(timer);
            console.log("finished");
        }
    }, 100);
}
