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

    var crawl_finished = false;
    var progress_object = {};
    var param = Object.create(config);
    param.finished = function(data, root_id) {
        console.log({"root": root_id, "data": data});
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
