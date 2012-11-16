WeiboVis.root_mid = "z5kHslftu"
WeiboVis.uid = "1197161814"
//WeiboVis.root_mid = "z5kvCFf0G";

function startCrawl(/**/) {
    crawlRepostTimeLine({
        depth_limit: 4,
        repost_limit: 2,
        page_limit: 50,
    });
}
function crawlRepostTimeLine(config)
{
    var crawl_info = {
        uid: WeiboVis.uid,
        depth_limit: config.depth_limit ? config.depth_limit : 10,
        repost_limit: config.repost_limit ? config.repost_limit : 5,
        page_limit: config.page_limit ? config.page_limit : 5
    };
    var progress_object = {};
    WeiboVis.getRepostTree(WeiboVis.root_mid, {
        depth_limit: crawl_info.depth_limit,
        repost_limit: crawl_info.repost_limit,
        page_limit: crawl_info.page_limit,
        finished: function(data, origin) {
            console.log(data);
        },
        progress: function(info) {
            if (info.status == "failed") {
                // TODO : add failure handler 
                console.log("failed");
            } else if(info.status == "progress") {
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
}
