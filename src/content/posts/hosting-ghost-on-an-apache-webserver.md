---
title: "Hosting Ghost on an Apache Webserver"
date: 2015-08-15T13:47:00-07:00
author: "Joe Purdy"
description: "Making a node.js application like Ghost cohabit with Apache doesn't have to be difficult, let's make it easy!"
slug: "2015/08/ghost-on-apache/hosting-ghost-on-an-apache-webserver"
tags:
  - "ghost"
  - "apache"
  - "node.js"
---

I just launched my new blog here using the [Ghost blogging platform](https://ghost.org/) and wanted to share a quick walkthrough to help everyone avoid some of the headaches I ran into along the way.

##### Assumptions
I'm writing with the assumption that you already have a VPS configured with the Apache webserver for deploying Ghost on. If you don't I recommend [AWS](https://aws.amazon.com/), their free tier will allow you to run a t2.micro VPS for the first year at no cost to you. Personally I use RHEL-like distros more often than Debian so I'll be writing this guide to target that side of the fence.

##### Installing the prerequisites
We'll need to install a few things to get your Ghost blog up and running without trouble. First up we need [node.js](https://nodejs.org/), specifically v.0.10.36. Ghost doesn't quite work correctly with the current 0.12.x releases of node.js and so we'll need to install the older 0.10.x release.

For RHEL Node.js is available from the NodeSource Enterprise Linux and Fedora binary distributions repository. You can add this repository to your VPS and install node.js by running the following commands as root:
```
$ sudo curl --silent --location https://rpm.nodesource.com/setup | bash -
$ sudo yum -y install nodejs-0.10.36
```
Once node.js has installed verify the version by running `node -v`. As long as the version is in the 0.10.x release instead of 0.12.x you're good to go.

In order to keep Ghost running once you terminate your SSH session we'll need a node process manager. My preferred choice here is [PM2](https://github.com/Unitech/pm2). Installing it is a cinch now that you have node.js and npm installed, simply run `sudo npm install pm2 -g` and you'll be set.

##### Getting Ghost
Next up we need to grab the latest Ghost release, which is actually a piece of cake!
```
$ curl -L https://ghost.org/zip/ghost-latest.zip -o ghost.zip
```
After downloading the latest release you'll need to unzip the contents into the folder you're storing your blog's source in. I use a folder structure on my webservers that places each site being hosted under the `/var/www/sites` directory. Following this pattern we can run the following commands to unzip and install dependancies for your new Ghost blog.
```
$ unzip -uo ghost.zip -d /var/www/sites/ghost
$ cd /var/www/sites/ghost && npm install --production
```
**NOTE:** You need to create the parent directory (`/var/www/sites`) before the unzip command is ran or else you'll get an error.

##### Configuring Apache
I follow the sites-available and sites-enabled model for configuring my Apache virtual hosts. Because of this the meat of my Apache configuration for any one site is spread between two `.conf` files.

1. Enable Proxy modules in `/etc/httpd/conf/httpd.conf`
Within the main Apache configuration file there will be a block of lines for loading various modules. Ghost is a node.js application that by default listens on port 2368, in order to host Ghost on Apache we need to proxy requests coming in on port 80 to `http://localhost:2368/`. To do so we'll need `mod_proxy` and `mod_proxy_http` enabled. As root we'll edit the configuration file for Apache and remove the `#` character commenting out those two modules:

        $ sudo vi /etc/httpd/conf/httpd.conf
    
    	BEFORE
    	...
    	#LoadModule proxy_module modules/mod_proxy.so
    	#LoadModule proxy_http_module modules/mod_proxy_http.so
        ...
    
	    AFTER
	    ... 
    	LoadModule proxy_module modules/mod_proxy.so
	    LoadModule proxy_http_module modules/mod_proxy_http.so
	    ...

        $ sudo service httpd restart

2. Create a virtualhost configuration for Ghost
My typical virtualhost configuration file for a PHP site would look like this:

	    # file: /etc/http/sites-available/example.com.conf
    	# vhost: example.com www.example.com

    	<VirtualHost *:80>
	        ServerName example.com
	        ServerAlias www.example.com
	        ServerAdmin webmaster@example.com
	        DocumentRoot /var/www/sites/example/public
	        <Directory /var/www/sites/example/public>
	            Order allow,deny
	            Allow from all
	        </Directory>
    	</VirtualHost>
	
    We're going to create a new virtualhost configuration for Ghost that looks nothing like that and uses the ProxyPass directive to serve the content on http://localhost:2368/ to inbound requests. Create a new file in the `/etc/httpd/sites-available` directory and populate it with the following virtualhost settings:

    	# file: <your-blog-domain>.conf
    	# vhost: <your-blog-domain> www.<your-blog-domain>
	    <VirtualHost *:80>
	        ServerName <your-blog-domain>
	        ServerAlias www.<your-blog-domain>
	        ServerAdmin webmaster@<your-blog-domain>
	        ProxyPreserveHost on
	        ProxyPass / http://localhost:2368/
	    </VirtualHost>

    Lastly we need to link the new virtualhost configuration to the enabled directory:

	    $ sudo ln -s /etc/httpd/sites-available/<your-blog-domain>.conf /etc/httpd/sites-enabled/.

That's it! We're all set with Apache, we still need to configure the process manager for Ghost however.

##### Starting Ghost with PM2
We're going to start, stop, and reload Ghost using a process manager called PM2, you may remember installing it earlier on. Setting up Ghost with it is fairly painless. To get this set up run the following commands:

	$ cd /var/www/sites/ghost
	$ NODE_ENV=production pm2 start index.js --name "Ghost"

And that's all it takes. You can start and stop Ghost now by running `pm2 start|stop Ghost` or reload without downtime using `pm2 reload Ghost`.

##### Wrap up
Your new blog should be up and running now, to verify just navigate to `http://<your-blog-domain>` and you should see the Welcome post. To configure the admin account navigate to `http://<your-blog-domain>/ghost`.

Feel free to leave any feedback you have from running through your installation in the comments below!
