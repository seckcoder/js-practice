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
    var crawl_info = {
        uid: WeiboVis.uid,
        depth_limit: config.depth_limit ? config.depth_limit : 10,
        repost_limit: config.repost_limit ? config.repost_limit : 5,
        page_limit: config.page_limit ? config.page_limit : 5
    };
    var tidy = function(root, data) {
        var weibos = data.weibos;
        var comments = data.comments;
        var result = {};
        var cal_children = function() {
            for (var weibo in weibos) {
                if (weibo.parent) {
                    if (weibos[parent].children)
                        weibos[parent].children.push(weibo.id);
                    else
                        weibos[parent].children = [weibo.id];
                }
            }
        }
        cal_children();
        var get_d3js_data = function() {
            var d3js_data = {};
            var visited = {};
            var dfs = function(root) {
                if (!visited[root]) visited[root] = true;
                d3js_data[root].name = weibos[root].user.screen_name;
                d3js_data[root].children = [];
                for (var children in weibos[root].children) {
                    if (!visited[children]) {
                        d3js_data[root].children.push(dfs(children));
                    }
                }
                return d3js_data[root];
            }
            return dfs(root);
        }
        console.log(get_d3js_data());
    }
    var crawl_finished = false;
    var progress_object = {};
    WeiboVis.getRepostTree(WeiboVis.root_mid, {
        depth_limit: crawl_info.depth_limit,
        repost_limit: crawl_info.repost_limit,
        page_limit: crawl_info.page_limit,
        finished: function(data, root_id) {
            tidy(root_id, data);
            crawl_finished = true;
        },
        progress: function(info) {
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
        },
        get_root: function(status, next) {
            next();
        }
    });
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
