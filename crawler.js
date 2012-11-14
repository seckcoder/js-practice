function crawlRepostTimeline()
{
    var root_mid = "z5c1hnW1B";
    var config = {
        depth_limit: 10,
        repost_limit: 5,
        page_limit: 5,
    };
    var crawl_info = {
        uid: "1197161814",
        depth_limit: config.depth_limit ? config.depth_limit : 10,
        repost_limit: config.repost_limit ? config.repost_limit : 5,
        page_limit: config.page_limit ? config.page_limit : 5
    };
    var crawl_control = WeiboVis.getRepostTree(root_mid, {
        depth_limit: crawl_info.depth_limit,
        repost_limit: crawl_info.repost_limit,
        page_limit: crawl_info.page_limit,
        finished: function(data, origin) {
        },
        progress: function(info) {
                  },
    }
    }
