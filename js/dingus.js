jQuery(document).ready(
    function($) {
        var PROTOCOL = 'web+podto';
        var DOMAIN = 'dingus.podto.org';

        var nextStep = function() {
            var activeStep = $('[data-step].active').last();
            var step = parseInt(activeStep.data('step'));
            var next = $('[data-step="' + (step + 1) + '"]');

            if(next) {
                next.addClass('active');
                $('html, body').animate(
                    {
                        scrollTop: next.offset().top
                    },
                    1000
                );
            }
        };

        var parseQueryString = function(url) {
            var qs = {};

            if(url == undefined) {
                url = window.location.search;
            }

            if(url) {
                var parts = url.substr(1).split('&')

                for(var i = 0; i < parts.length; i ++) {
                    var pair = parts[i].split('=');
                    var key = decodeURIComponent(pair[0]);
                    var value = decodeURIComponent(pair[1]);

                    qs[key] = value;
                }
            }

            return qs;
        }

        var setButton = function() {
            var value = $('input[name="url"]').val();
            var nav = $('.navigator');
            var uri = PROTOCOL + ':url=' + encodeURIComponent(value);

            if(value) {
                nav.attr('href', uri).removeAttr('disabled')
            } else {
                nav.attr('disabled', 'disabled');
            }
        };

        (
            function() {
                var qs = parseQueryString();

                if(qs.test) {
                    if(qs.test.substr(0, PROTOCOL.length + 1) == PROTOCOL + ':') {
                        qs = parseQueryString(
                            '?' + qs.test.substr(PROTOCOL.length + 1)
                        );

                        if(qs.url) {
                            $('input[name="url"]').val(qs.url).closest('[data-step]').addClass('active');
                            setButton();
                            nextStep();

                            if(typeof(fetch) == 'undefined') {
                                $('[data-step="3"] .text-warning').text(
                                    'The good news is that the URI worked. The bad news ' +
                                    'is we can\'t show you anything about the feed you ' +
                                    'chose, because the fetch() function isn\t supported ' +
                                    'by your browser, and we\'re not running any server-side ' +
                                    'code that would allow us to show you the feed. This doesn\'t ' +
                                    'mean that there\'s a problem with the URI or the feed you chose, ' +
                                    'just that our testing tool isn\'t sophisticated enough to ' +
                                    'grab the data directly via the browser.'
                                );

                                return;
                            }

                            return fetch(qs.url).then(
                                function(response) {
                                    return response.text();
                                }
                            ).catch(
                                function(e) {
                                    $('[data-step="3"] .text-danger').text(
                                        'The good news is that the URI worked. The bad news ' +
                                        'is we can\'t show you anything about the feed you ' +
                                        'chose, because your browser elected not to fetch it. This could be ' +
                                        'because the feed URL doesn\'t exist, it doesn\'t allow requests from ' +
                                        'web browsers, or it doesn\'t use SSL (and this dingus does). ' +
                                        'Because we\'re not running any server-side code that would allow us to show ' +
                                        'you the feed, we have to rely on the browser, which is protecting you from ' +
                                        'potentially insecure content. This doesn\'t mean that there\'s a problem with the ' +
                                        'URI or the feed you chose, just that our testing tool isn\'t sophisticated enough ' +
                                        'to grab the data directly via the browser.'
                                    );
                                }
                            ).then(
                                function(str) {
                                    return new window.DOMParser().parseFromString(str, 'text/xml');
                                }
                            ).then(
                                function(data) {
                                    var channel = data.querySelector('channel');
                                    var title = '';

                                    if(channel) {
                                        title = channel.querySelector('title').innerHTML;
                                        $('[data-step="3"] .text-success').html(
                                            '"' + title + '" ' +
                                            'looks to be the name of the podcast you want to ' +
                                            'subscribe to.<br>This concludes the test, as it ' +
                                            'shows that your browser is compatible with the podTo ' +
                                            'protocol, and your feed is accessible.'
                                        );

                                        $('[data-step="3"] code').text(
                                            '<a href="' + $('a.navigator').attr('href') + '">Subscribe to ' +
                                            title + '</a>'
                                        );
                                    }
                                }
                            );
                        }
                    }
                }
            }
        )();

        $('[data-action="register"]').on('click',
            function() {
                var section = $(this).closest('[data-step]');

                if('registerProtocolHandler' in navigator) {
                    try {
                        navigator.registerProtocolHandler(
                            PROTOCOL,
                            '//' + DOMAIN + '/?test=%s',
                            'podTo Testing Dingus'
                        );

                        nextStep();
                        setButton();
                    } catch(err) {
                        section.find('.error').text(err.message);
                    }
                } else {
                    section.find('.error').text(
                        'Sorry, custom protocol registration is not supported by your browser.'
                    );
                }
            }
        );

        $('[data-action="reset"]').on('click',
            function() {
                $('[data-step="3"].active').removeClass('active');
                $('.text-success, .text-warning, .text-danger').html('');
                $('html, body').animate(
                    {
                        scrollTop: $('[data-step="2"]').offset().top
                    },
                    300
                );
            }
        );

        $('input[name="url"]').on('input',
            function() {
                setButton()
            }
        );
    }
);
