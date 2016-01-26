# resume-pdf-to-json
A Node module that parses a LinkedIn Resume PDF and returns a JSON Object and/or outputs a JSON file.

LinkedIn Resume's are available on your profile under **View Profile As** ▼ **Save to PDF**

## Installation

```shell
npm install resume-pdf-to-json --save-dev
```

## Usage

### Return JSON
```js

var resumePdfToJson = require('resume-pdf-to-json');

var path = 'data/[FirstLast].pdf';

return resumePdfToJson(path)
    .then(function(data) {
        return {
            'resume': data,
        };
    });

```

### Return JSON + Output JSON File
```js

var resumePdfToJson = require('resume-pdf-to-json');

var path = 'data/[FirstLast].pdf';
var output = 'data/outputname.json';

return resumePdfToJson(path, {'output': output})
    .then(function(data) {
        return {
            'resume': data,
        };
    });

```

### Support
There are multiple sections of the LinkedIn PDF resume output, however, not all have been tested. The following sections have been accomodated for;

- Summary
- Experience
- Volunteer Experience
- Skills & Expertise
- Education
- [number] person has recommended [name]
- [number] people have recommended [name]

Support for additional sections may be added in the future.

