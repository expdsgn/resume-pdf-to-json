

'use strict';


/**
 * Requirements
 */

var Promise = require('promise'),
    extend = require('extend'),
    pdfText = require('pdf-text');
    // jsonfile = require('jsonfile');
    // If user wishes to out put json, will be imported
    // in p(); documented here for reference.


/**
 * Settings
 */

var settings = {
    'headers': [
        'Summary',
        'Experience',
        'Volunteer Experience',
        'Skills & Expertise',
        'Education',
        'person has recommended',
        'people have recommended'
    ],
    'subsections': [
        'Experience',
        'Volunteer Experience'
    ],
    'listsections': [
        'Skills & Expertise'
    ],
    'onelinesections': [
        'Education'
    ],
    'lineLength': 99, // could be 99
    'replace': [
        ['  -  ', ' - '],
        ['  at   ', ' at '],
        ['  ', ' '],
        [' , ', ', ']
    ]
};


/**
 * Functions
 */

function resumePdfToJson(cb) {

    var service = this;

    service = {
        'parse': parse,
        'index': index,
        'isHeader': isHeader,
        'isTime': isTime,
        'isDateRange': isDateRange,
        'isPageNum': isPageNum,
        'isRecommendation': isRecommendation,
        'skip': skip,
        'replace': replace,
        'indexHeaders': indexHeaders
    };

    function isHeader(line) {
        if (settings.headers.indexOf(line) > -1) return line;
        return false;
    }

    function isTime(line) {
        var i0 = line[0];
        var iX = line[line.length - 1];
        return (i0 === '(' && iX === ')');
    }

    function isDateRange(line) {
        if (typeof line === 'undefined') return false;
        var i0 = line.split(' - ')[0];
        var date = i0[i0.length - 1];
        return (line.indexOf(' - ') > -1 && isNaN(date) === false);
    }

    function isPageNum(line) {
        return (line === 'Page' || !isNaN(+line));
    }

    function isRecommendation(line) {
        var i0 = line.indexOf('person has recommended');
        var i1 = line.indexOf('people have recommended');
        return (i0 !== -1 || i1 !== -1);
    }

    function indexHeaders(chunks) {
        var h, headers = [];
        for (var sh = settings.headers.length - 1; sh >= 0; sh--) {
            h = settings.headers[sh];
            if (chunks.indexOf(h) > -1) headers.push(chunks.indexOf(h));
        }
        // Look for recommendations
        for (var ch = chunks.length - 1; ch >= 0; ch--) {
            if ( service.isRecommendation(chunks[ch]) ) headers.push(ch);
        }
        headers.sort(function(a, b){return a - b;});
        for (var i = headers.length - 1; i >= 0; i--) {
            h = headers[i];
            headers[i] = chunks[h];
        }
        return headers;
    }

    function index(section) {
        return service.headers.indexOf(section);
    }

    function skip(name, line) {
        var skip = false;
        skip = (line === 'Contact ' + name + ' on LinkedIn') ? true : skip;
        return skip;
    }

    function replace(line) {
        var r;
        for (var i = 0; i < settings.replace.length; i++) {
            r = settings.replace[i];
            line = line.replace(r[0] , r[1]);
        }
        return line;
    }

    function parse(chunks) {

        var cut, h, r, t, s, is, h1, h2, h3, ti;

        var line, next, header, section,
            head, time, range, text, prev;

        var data = [];
        var subsections = [];
        var onelinesections = [];
        var recommendations = [];
        var groups = [];

        var subsection = false;
        var listsection = false;
        var onelinesection = false;
        var recommendation = false;

        var skip = false;
        var cnt = -1;

        var dataHeader = {
            'head': [
                chunks[2],
                chunks[3],
                chunks[4]
            ]
        };

        var firstName = dataHeader.head[0].split(' ')[0];

        // clean out the extra headers
        for (var x = 0; x < chunks.length; x++) {
            cut = dataHeader.head.indexOf(chunks[x]);
            if ( cut > -1 ) {
                chunks.splice(x, 1);
            }
        }

        // clean out the page numbers
        for (var y = 0; y < chunks.length; y++) {
            if (service.isPageNum(chunks[y]) && chunks[y] === 'Page') {
                chunks.splice(y, 2);
            }
        }

        // create index reference to reflect order of
        // headers in the pdf
        service.headers = service.indexHeaders(chunks);

        for (var i = 0; i < chunks.length; i++) {

            line = chunks[i];

            if (service.skip(firstName, line)) continue;

            h = service.isHeader(line);
            r = service.isRecommendation(line);

            line = line.trim();
            line = service.replace(line);

            // create new section if this line is a header
            if (h || r) {

                header = line;

                next = service.headers[service.index(header) + 1];

                // if the headline is a recomendation, get the amount of
                // people recommended and set next to false.
                if (service.isRecommendation(line)) {
                    header = chunks[i - 1] + ' ' + line;
                }

                cnt = cnt + 1;

                data.push({
                    'head': [header],
                    'text': [],
                    'sections': []
                });

            }

            // if this section has sub-sections and it is
            // not a header save it in a different array
            // for parsing.
            if (subsection && !h && !r) {
                if (!subsections[cnt]) subsections[cnt] = {'head': [header], 'text': []};
                subsections[cnt].text.push(line);
            // if the section is a list section, just add
            // to the text as a list.
            } else if (listsection && !h && !r) {
                data[cnt].text.push(line);
            // if this section is a one line section and
            // it is not a header save it in a different
            // array for parsing.
            } else if (onelinesection && !h && !r) {
                if (!onelinesections[cnt]) onelinesections[cnt] = {'head': [header], 'text': []};
                onelinesections[cnt].text.push(line);

            // if this section is a recommendation, not a header,
            // and not a recommendation header, parse it for the
            // recommendation section
            } else if (recommendation && !h && !r) {

                // if it's a new recommendation, create a new section
                if (line[0] === '"') {
                    data[cnt].sections.push({'text':[line]});
                // else just add line to the last recomendation in the list.
                } else {
                    ti = data[cnt].sections.length - 1;
                    t = data[cnt].sections[ti].text;
                    data[cnt].sections[ti].text = (t + ' ' + line).trim();
                }
            // save the line in this section's text array
            // if the line isn't a page number, and the length
            // is greater than the base paragraph line length.
            } else if (data[cnt] && !service.isPageNum(line) && !h && !r) {
                // concantenate the text.
                t = data[cnt].text;
                data[cnt].text = (t + ' ' + line).trim();
            }


            // set the subsection flag if the header is subsection
            if (settings.subsections.indexOf(header) !== -1) subsection = true;

            // set the listsection flag if the header is listsection
            if (settings.listsections.indexOf(header) !== -1) listsection = true;

            // set the onelinesection flag if the header is a onelinesection
            if (settings.onelinesections.indexOf(header) !== -1) onelinesection = true;

            // set the recommendation flag if the header is a recommendation
            if (typeof header !== 'undefined' && service.isRecommendation(header))
                recommendation = true;


            // if the next line is the section after the special section
            if (chunks[i + 1] === next || !next) {
                subsection = false;
                listsection = false;
                onelinesection = false;
                recommendation = false;
            }

        }

        /**
         * Parse info for subsections
         * Sub-sections are classified by having three head lines
         * with the third being enclosed in parentheses, ex. '(...)'
         */
        for (var ss = 0; ss < subsections.length; ss++) {

            // some indexes are empty, skip them if they are
            if (typeof subsections[ss] === 'undefined') continue;

            text = subsections[ss].text;
            is = service.index(subsections[ss].head[0]);

            // reset the count for this section
            cnt = -1;

            // got through the text of the sub sections
            for (var s = 0; s < text.length; s++) {

                line = text[s];
                prev = text[s - 1];
                h1 = line;
                h2 = text[s + 1];
                h3 = text[s + 2];

                // if the time variable fits the time format,
                // create a new section and set the headline vars.
                // if (h3 && service.isTime(h3)) {
                // if (s === 0 || nuw) {
                if (service.isDateRange(h2)) {
                    head = [h1, h2];
                    cnt = cnt + 1;
                    if (h3 && service.isTime(h3)) head.push(h3);
                    data[is].sections.push({
                        'head': head,
                        'text': ''
                    });
                // if the time isn't time, and the line isn't
                // a page number, and the line isn't one of
                // the headline vars, add line to the section text.
                } else if (line && !service.isPageNum(line) && head.indexOf(line) === -1) {
                    // concantentate section text
                    t = data[is].sections[cnt].text;
                    data[is].sections[cnt].text = (t + ' ' + line).trim();
                }

            }

        }

        /**
         * Parse info for one line sections
         * Sub-sections are classified by groups of two lines
         */
        for (var ol = 0; ol < onelinesections.length; ol++) {

            // some indexes are empty, skip them if they are
            if (typeof onelinesections[ol] === 'undefined') continue;

            text = onelinesections[ol].text;
            is = service.index(onelinesections[ol].head[0]);
            // group the sections by two
            while (text.length > 0) {
                groups.push(text.splice(0, 2));
            }
            // go through the groups and add them as sections.
            for (var g = 0; g < groups.length; g++) {
                head = [ groups[g][0] ];
                text = groups[g][1];
                // if they aren't page numbers and they are groups
                // of two, create sections for them.
                if (groups[g].length === 2 && !service.isPageNum(text) && data[is]) {
                    data[is].sections.push({
                        'head': head,
                        'text': text
                    });
                }
            }

        }

        data.unshift(dataHeader);

        return data;

    }


    pdfText(settings.path, function(err, chunks) {

        if (err) {

            cb(err, null);

        } else {

            try {

                cb(null, service.parse(chunks));

            } catch (e) {

                console.log(e);
                cb(e, null);

            }

        }

    });


}


function p(resolve, reject) {

    resumePdfToJson(function(err, data) {

        if (err) {

            reject(err);
            return;

        }

        if (settings.output) {

            require('jsonfile').writeFile(settings.output, data);

        }

        resolve(data);

    });

}


module.exports = function(path, config) {

    settings = extend(true, {}, config, settings);

    settings.path = path;

    return new Promise(p);

};