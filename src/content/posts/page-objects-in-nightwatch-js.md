---
title: "Page Objects in Nightwatch.js"
date: 2016-06-07T16:14:00-07:00
author: "Joe Purdy"
description: "Page objects are critical to maintaining automation suites and protecting against flakey tests. Learn how to enjoy building them with Nightwatch.js."
slug: "2016/06/page-objects-in-nightwatch-js/page-objects-in-nightwatch-js"
tags:
  - "selenium"
  - "page objects"
  - "Nightwatch.js"
  - "JavaScript"
  - "testing"
archived: true
---

Here we go, yet another blog post discussing the page object pattern. I'm sure I've read at least a dozen similar articles by now in my adventures in automated testing and yet here I am writing another one. I must be mad, right? Well not exactly. Want to know something that is mad? The fact that people are still writing Selenium tests with inline element selectors and API calls. Every time I encounter a test suite riddled with flakey tests stemming from overusing direct calls to the Webdriver API and elements being selected on the fly I'm instantly reminded of a great quote by Mr. Stewart himself:

> If you have WebDriver APIs in your test methods, You're Doing It Wrong.
>
> -- Simon Stewart.

In my career I've been lucky to have exposure to a handful of Webdriver implementations including suites using bindings from Java, PHP, Python, Ruby, and even some Python. In every case regardless of which language your team decides to use with Selenium the fact remains true that if you ignore the page object pattern and use the Webdriver API directly in your test methods you're going to have a bad time.

![You're gonna have a bad time](https://s3-us-west-2.amazonaws.com/joecodes/assets/badtime.png)

Most recently I've started using the [nightwatch.js](http://nightwatchjs.org/) library for performing Selenium automation using JavaScript and found the support for page objects is really great out of the box. so I thought it'd be helpful to document and share some examples of Do's and Don'ts for implementing the page object pattern in your nightwatch.js tests.

Page objects are critical to maintaining automation suites and protecting against flakey tests. The page object pattern in it's simplest form requires that all test code that either defines a UI element's location in a page or invokes the Webdriver API be separated away from the test case file and into a page object file:

## Element selectors
Element selectors in nightwatch.js can be used inline as part of a test case as follows:
### Defining element selectors inside the test case
`tests/admin/login.js`
```js
// Don't try this at home, use page objects instead!
'use strict';

module.exports = {
  'Login to Admin Panel' : function (browser) {
    browser.url(this.launchUrl + '/admin')
           .setValue('input[name=username]', 'admin')
           .setValue('input[name=password]', 'password')
           .click('input[type=submit]');

    browser.end();
  }
}
```
In the above example the `.setValue()` and `.click()` Webdriver API methods are provided inline element selectors. Let's assume this chunk of test code for performing a login is repeated in many test cases. If a change is made to the UI that causes the selector to no longer be valid updates must be made inline to every single test case that defines the element inline. This is not efficient, compare that example to the following to see the difference in using page objects for element selector definition:
### Defining element selectors in a page object
`pages/admin/login.js`
```js
'use strict';

module.exports = {
  url: function() {
    return this.api.launchUrl + '/admin';
  },
  elements: {
    usernameField: {
      selector: 'input[name=username]'
    },
    passwordField: {
      selector: 'input[name=password]'
    },
    submit: {
      selector: 'input[type=submit]'
    }
  }
};
```
`tests/admin/login.js`
```js
'use strict';

module.exports = {
  'Login to Admin Panel' : function (browser) {
    var login = browser.page.admin.login();

    login.navigate()
         .setValue('@usernameField', 'admin')
         .setValue('@passwordField', 'password')
         .click('@submit');

    browser.end();
  }
};
```
While the latter approach with page object element definitions may appear to take more work upfront to implement the long term benefit to efficiency is well worth it. Once elements are defined in a page object there is a single canonical definition for the UI selectors so any changes to UI code that break a selector can be fixed in a single location rather than having to hunt down dozens if not hundreds of ad-hoc element selectors in test cases that are failing.

## Webdriver API Commands
Whenever possible Webdriver API calls should be converted into custom page object commands to create reusable page interaction flows for use in test cases. To make this easier to understand think about how a person interacts with a web application. If a user wants to login to a protected area this action could simply be described in a custom method instead of the individual Webdriver API methods to perform the login. Compare the following examples:

### Using Webdriver API methods inside test case
`tests/admin/login.js`
```js
// This is bad and I should feel bad for writing it.
'use strict';

module.exports = {
  'Login to Admin Panel' : function (browser) {
    var login = browser.page.admin.login();

    login.navigate()
         .setValue('@usernameField', 'admin')
         .setValue('@passwordField', 'password')
         .click('@submit');

    browser.end();
  }
};
```

### Using Page Object methods inside test case
`pages/admin/login.js`
```js
'use strict';

module.exports = {
  url: function() {
    return this.api.launchUrl + '/admin';
  },
  elements: {
    usernameField: {
      selector: 'input[name=username]'
    },
    passwordField: {
      selector: 'input[name=password]'
    },
    submit: {
      selector: 'input[type=submit]'
    }
  },
  commands: [{
    signInAsAdmin: function() {
      return this.setValue('@usernameField', 'admin')
                 .setValue('@passwordField', 'password')
                 .click('@submit');
    }
  }]
};
```
`tests/admin/login.js`
```js
'use strict';

module.exports = {
  'Login to Admin Panel' : function (browser) {
    var login = browser.page.admin.login();

    login.navigate()
         .signInAsAdmin();

    browser.end();
  }
};
```
In the second example using page objects we've completely abstracted all Webdriver API method calls into the page object leaving the test case with a human readable domain specific language that describes what actions we want to execute for this test. If any changes are made to the login flow in the future we have a single location to make necessary updates to our test code. As an example imagine if an additional field was added to our login form for answering a security question as part of the login process. We would easily be able to add this to our page object by defining a new element selector for the security question field and adding an additional `.setValue()` Webdriver API call to the `.signInAsAdmin()` page object method. Now every instance of the `.signInAsAdmin()` method in our tests is updated at once.

## Conclusion
So there you have it, the absolute basics of using page objects with nightwatch.js. I dare you to come up with a reason why using the Webdriver API in your test methods is the right way now. I can't think of one, anyway you slice it the maintainability and efficiency of your test cases will improve once you start DRYing things up with page objects. Plus nightwatch.js provides tons of support for the page object pattern so there's no real excuse for ignoring this design pattern.

Did I miss anything? Feel free to chime in within the comments below with your thoughts!
