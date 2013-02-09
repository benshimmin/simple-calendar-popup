define(["hgn!partials/calendar"], function(CalendarTemplate) {

    var dict = {
        MONTHS : [
            "January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December"
        ],

        DAYS : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
    };

    var Calendar = Backbone.View.extend({

        events : {
            "click .controls div" : "changeMonth"
        },

        initialize : function() {
            _.bindAll(this, "toggle");

            $(this.options.target).on("click", this.toggle);
        },

        toggle : function() {
            if (this.open) {
                this.open = false;
                this.remove();

                $(window).off("scroll.CAL_SCROLL");

                return;
            }

            this.data = this.processDate(this.options.start);

            this.$container = this.make("div", {"class" : "cal-container"});
            $("body").append(this.$container);
            this.setElement(this.$container);

            this.open = true;

            this.processMonth();
            this.render();

            // close on scroll
            $(window).on("scroll.CAL_SCROLL", _.bind(function() {
                this.toggle();
            }, this));
        },

        changeMonth : function(event) {
            var cur  = this.data,
                date = new Date(cur.year, cur.month),
                left = $(event.currentTarget).hasClass("left");

            date.setMonth(date.getMonth() + (left ? -1 : 1));

            this.data = this.processDate(date);

            this.$(".cal-inner").remove();

            this.processMonth();
            this.render();
        },

        render : function() {

            var data   = _.clone(this.data);
            data.month = dict.MONTHS[this.data.month];

            this.$el.append(CalendarTemplate(data));

            this.$(".is-inactive a").removeAttr("href");
        },

        processDate : function(date) {
            return {
                month : date.getMonth(),
                day   : date.getDate(),
                year  : date.getFullYear(),
                days  : dict.DAYS,
                cells : []
            };
        },

        processMonth : function() {
            var len = DateUtils.daysInMonth(this.data.month, this.data.year),
                i   = 1;

            var startDays = this.padStart(),
                endDays   = this.padEnd(),
                regDays   = [];

            while (len--) {
                regDays.push(this.createCell(
                    i++, this.data.month, this.data.year
                ));
            }

            var cells = startDays.concat(regDays.concat(endDays));

            _.each(cells, function(cell) {
                this.data.cells.push(cell)
            }, this);
        },

        padStart : function() {
            var month = this.data.month,
                year  = this.data.year,
                date  = new Date(year, month),
                first = date.getDay();

            // month starts on Monday, so nothing to pad
            if (first === 1) {
                return [];
            // month starts on Sunday, so we need to add 6 extra days
            } else if (first === 0) {
                first = 7;
            }

            var prev      = DateUtils.getPreviousMonth(month, year),
                prevCount = DateUtils.daysInMonth(prev.month, prev.year),
                days      = [];

            var i = 1;
            for (; i < first; i++) {
                days.push(this.createCell(
                    prevCount - first + i + 1,
                    prev.month,
                    prev.year
                ));
            }

            return days;
        },

        padEnd : function(month, year) {
            var month        = this.data.month,
                year         = this.data.year,
                lastDay      = DateUtils.daysInMonth(month, year),
                lastDayIndex = new Date(year, month, lastDay).getDay() - 1;

            // if the month ends on a Sunday, we have nothing to pad
            if (lastDayIndex === -1) return [];

            var days = [],
                next = DateUtils.getNextMonth(month, year);

            var i = 1;
            for (; i <= (6 - lastDayIndex); i++) {
                days.push(this.createCell(
                    i, next.month, next.year
                ));
            }

            return days;
        },

        createCell : function(day, month, year) {
            var date = new Date(year, month, day),
                now  = new Date();

            var dateIsToday = function() {
                return date.getDate()     == now.getDate()
                    && date.getMonth()    == now.getMonth()
                    && date.getFullYear() == now.getFullYear();
            };

            var getCellClass = _.bind(function() {
                var clz = "";

                switch (true) {
                // should be inactive if:
                // 1. in the past
                // 2. today
                // 3. more than 3 months hence
                    case (date < now
                          || dateIsToday()
                          || date > this.options.end):

                        clz = "is-inactive";
                        break;

                // the current slot
                    case this.options.start.valueOf() === date.valueOf():
                        clz = "is-current";
                        break;

                // the current month
                    case month === this.data.month:
                        clz = "is-active";
                        break;
                }

                return clz;

            }, this);

            var cell = {
                day : day,
                type : getCellClass(),
                link : Calendar.Parser.createLink(date)
            };

            return cell;
        }

    });

    // helper methods
    var DateUtils = {
        daysInMonth : function(month, year) {
            return new Date(year, month + 1, 0).getDate();
        },

        getPreviousMonth : function(month, year) {
            var d = new Date(year, month);
            d.setMonth(month - 1);
            return {
                month : d.getMonth(),
                year  : d.getFullYear()
            }
        },

        getNextMonth : function(month, year) {
            var d = new Date(year, month);
            d.setMonth(month + 1);
            return {
                month : d.getMonth(),
                year  : d.getFullYear()
            }
        }
    };


    // expose dictionary in case it might ever need to be localised
    Calendar.dict = dict;

    // simple parsing functions (easily overridden)
    Calendar.Parser = {
        start : function(sel) {
            return new Date($(sel).text());
        },

        end : function() {
            var date = new Date;
            // set the end date of a slot to be three months from now
            date.setMonth(date.getMonth() + 3);
            return date;
        },

        // this function would need to be overridden with an appropriately-
        // formatted link
        createLink : function(date) {
            return "?" + date.valueOf();
        }
    };

    return Calendar;
})