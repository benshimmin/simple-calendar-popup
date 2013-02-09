require.config({
    baseUrl  : "js",
    paths    : {
        hgn   : "lib/hgn",
        text  : "lib/text",
        hogan : "lib/hogan"
    },
    urlArgs  : "bust=" + (new Date()).getTime()
});


require(["cal"], function(Calendar) {
    $(function() {

        var settings = {
            target : ".calendar-icon",
            start  : Calendar.Parser.start(".current-slot"),
            end    : Calendar.Parser.end()
        };

        new Calendar(settings);
    });
})