---
title: "Dockerize WordPress with Roots.io"
date: 2017-06-25T13:51:43-07:00
author: "Joe Purdy"
description: "Learn about a turbo-charged WordPress development workflow that uses Docker and the Roots.io 12 factor WordPress application model."
slug: "2017/06/dockerize-wordpress-roots-io/dockerize-wordpress-with-roots.io"
tags:
  - "docker"
  - "wordpress"
  - "php"
---

These days I don't spend much time working with PHP, but I still have a handful of clients that are running WordPress sites. There's still something to be said for the ubiquity of WordPress, but if I'm being completely honest the architecture drives me mad.


The Roots.io team has a great write up on applying the principles of a [12 factor application to WordPress](https://roots.io/twelve-factor-wordpress/) that I highly recommend. Their open source projects are a great way to hit the ground running with a new WordPress project. Trellis, their server environment uses Ansible and Vagrant under the covers which are great tools, but these days I find myself reaching for Docker in my workflow for building applications.

With this in mind I set about creating a dockerized starter project designed for running WordPress with Bedrock. For bonus points I also pulled in Sage for a theme boilerplate. 

If you're one of those impatient tl;dr types you can head over to the repo at [github/joepurdy/DockPress](https://github.com/joepurdy/DockPress) to get started.
- - - -

## Prerequisites 
The only real requirement to what I'll be talking about here is a working knowledge of both Docker and WordPress. You'll need Docker installed on your computer, you can download the [latest version here](https://www.docker.com/community-edition#/download). I’m not going to dive very deep into Docker here and you may need to learn a bit about the basics first. You can take the [Try Docker course over at Code School](https://www.codeschool.com/courses/try-docker) or Chris Fidao’s [Shipping Docker](https://shippingdocker.com/) for a spin if video courses are your thing. 

## Planning the application structure 
I use Docker Compose for multi-service applications so the first step is to begin planning what the underlying services are that are necessary to run the application. For WordPress I keep things simple with two services, one for MySQL and another application image combining nginx and PHP.

It's also perfectly acceptable to break the application container apart and dedicate a service to nginx and another to PHP, but for my needs I prefer keeping them in the same container.

## Defining multi-layered Docker Compose configurations
With Docker Compose you can use a set of layered configuration files. In practice I define a `docker-compose.dev.yml` file that in turn extends the `docker-compose.base.yml`. 

The advantage here is the base file can include configuration common to everywhere you need to run the application while the .dev file adds specific configuration for running the application in a development environment. Then you can add a .staging, .prod, and any other variations to suit your deployment needs.

## Building the base configuration
Alright, it's time to roll up our sleeves and start work defining the services for our Docker backed WordPress application. To start with we’ll define the core configuration that will be extended by specific environments. Every instance of our dockerized WordPress application will have two services as discussed earlier. These services will coexist on a network to allow the app container to talk to the database container. For data volumes we’ll be mirroring the local `src` folder that contains the WordPress application to `/var/www/html` and creating a volume to persist the MySQL database.

The app container will be built using a custom Dockerfile, but the database container can be based on a standard MySQL database image, personally I use the [MariaDB image](https://hub.docker.com/_/mariadb/). Here’s an example of the `docker-compose.base.yml` file as outlined:
```
version: '2'
services:
  app:
    build:
      context: ./docker/app
      dockerfile: Dockerfile
    image: joepurdy/dockpress
    volumes:
     - ./src:/var/www/html
    networks:
     - wpnet
  mysql:
    image: mariadb:10.1
    volumes:
     - mysqldata:/var/lib/mysql
    networks:
     - wpnet
```

## Extending the base configuration
Next up we’ll create the `docker-compose.dev.yml` file which is responsible for customizing the docker environment for development work. To do so we’ll add configuration specifying the exposed ports and environment variables for each container. The app container will need to map to port 80 to enable access to the nginx proxy and the database container needs access to port 3306 for MySQL.

The host port for each of these will be set using an environment variable like `${APP_PORT}` and `${DB_PORT}`. Additionally we need to set some environment variables on the database container to set-up the app database and secrets. Again we’ll use environment variables to accomplish this.

Lastly we need to specify details for the docker network and the MySQL data volume. At this point we should have the following configuration for the `docker-compose.dev.yml` file:
```
version: '2'
services:
  app:
    extends:
      file: docker-compose.base.yml
      service: app
    ports:
     - "${APP_PORT}:80"
  mysql:
    extends:
      file: docker-compose.base.yml
      service: mysql
    ports:
      - "${DB_PORT}:3306"
    environment:
      MYSQL_ROOT_PASSWORD: "${DB_ROOT_PASS}"
      MYSQL_DATABASE: "${DB_NAME}"
      MYSQL_USER: "${DB_USER}"
      MYSQL_PASSWORD: "${DB_PASS}"
networks:
  wpnet:
    driver: "bridge"
volumes:
  mysqldata:
    driver: "local"
```

## Building the custom app container
As outlined above in the development Docker Compose configuration we’ll be building a custom docker image for the app container. This container needs to include a PHP runtime to serve WordPress and we’ll use nginx as a reverse proxy frontend.

I use Ubuntu 16.04 as the base for this application server and because docker containers have a single startup process I install supervisor to act as a single entry point to run both nginx and PHP-FPM. To help work on WordPress projects the app container also has [Composer](https://getcomposer.org/) and [WP-CLI](http://wp-cli.org/) available.

The app container will have three configuration files to get nginx, PHP-FPM, and supervisor up and running. I’ll spare the details about these configuration files since they’re really just boilerplate. In essence there is a default  site configuration for nginx, a php-fpm.conf file, and the supervisors.conf file which tells supervisor to start nginx and php-fpm. You can view these conf files in the DockPress repo.

I use the following Dockerfile to build the app container. It suits my needs, but feel free to change anything if you want to use a different OS or different software.
```
FROM ubuntu:16.04

MAINTAINER Joe Purdy <hello@joepurdy.io>

# Install locales
RUN apt update && apt install -y locales
RUN locale-gen en_US.UTF-8

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# Get latest version of software-properties-common first
RUN apt update && apt upgrade -y && apt install -y software-properties-common

# Pre-add php7 repo
RUN add-apt-repository -y ppa:ondrej/php \
    && apt update

# Basic Requirements
RUN apt update \
    && apt install -y nginx curl unzip git supervisor wget python-pip sqlite3

# PHP Requirements
RUN apt update \
    && apt install -y php7.1 php7.1-fpm php7.1-cli php7.1-mcrypt php7.1-gd php7.1-mysql \
    php7.1-imap php-memcached php7.1-mbstring php7.1-xml php7.1-curl \
    php7.1-sqlite3

# Wordpress Requirements
RUN apt update \
    && apt install -y libnuma-dev php7.1-intl php-pear php7.1-imagick \
    php7.1-ps php7.1-pspell php7.1-recode php7.1-sqlite php7.1-tidy php7.1-xmlrpc php7.1-xsl

# Install Composer
RUN php -r "readfile('https://getcomposer.org/installer');" | php -- --install-dir=/usr/bin/ --filename=composer

# Install WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# Misc. Cleanup
RUN mkdir /run/php \
    && apt remove -y --purge software-properties-common \
    && apt -y autoremove \
    && apt clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && echo "daemon off;" >> /etc/nginx/nginx.conf \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

COPY default /etc/nginx/sites-available/default
COPY php-fpm.conf /etc/php/7.1/fpm/php-fpm.conf

EXPOSE 80

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

CMD ["/usr/bin/supervisord"]
```

## Putting it all together with a handy develop command
To make it easier to initialize and work with the dockerized WordPress environment for development I use a custom shell script to start the development environment and run arbitrary commands.

This is a technique I picked up from [Chris Fidao’s Shipping Docker course](https://shippingdocker.com/docker-in-development/) and I’ve been meaning to switch over to a Makefile instead, but for the time being the shell script approach works well enough. The concept is pretty simple, you create an executable script that sets the environment variables we registered earlier in the `docker-compose.dev.yml` file and starts the docker environment with `docker-compose up`.

By default this script uses the development environment, but you could extend it to be used for staging or production environments. I won’t go into any detail here about non-dev environments since everyone has their own preference on how to handle staging and production deployment.

The script also accepts args for Composer and WP-CLI to make running these utilities simple for your development purposes. There’s also an `init` command which will use Composer to install the Bedrock version of WordPress into the `src` folder as well as initializing a Sage theme based on the latest `dev-master` version. Here’s the full script for reference and I’ll discuss some of the key details and how to customize it for your needs:
```
#!/usr/bin/env bash

# Set environment variables for dev
export APP_PORT=${APP_PORT:-80}
export DB_HOST=${DB_HOST:-mysql}
export DB_PORT=${DB_PORT:-3306}
export DB_ROOT_PASS=${DB_ROOT_PASS:=secret}
export DB_NAME=${DB_NAME:=wordpress}
export DB_USER=${DB_USER:=wordpress}
export DB_PASS=${DB_PASS:=secret}

# Decide which docker-compose file to use
COMPOSE_FILE="dev"

COMPOSE="docker-compose -f docker-compose.$COMPOSE_FILE.yml"

if [ $# -gt 0 ]; then
  # If "composer" is used, pass-thru to "composer"
  # inside a new container
  if [ "$1" == "composer" ]; then
      shift 1
      $COMPOSE run --rm $TTY \
          -w /var/www/html \
          app \
          composer "$@"

  # If "wp" is used, pass-thru to "wp-cli"
  elif [ "$1" == "wp" ]; then
      shift 1
      $COMPOSE run --rm $TTY \
          -w /var/www/html \
          app \
          wp --allow-root "$@"

	# if "init" is used, make the src directory and
	# install latest version of Bedrock. Afterwards
	# install a Sage theme into Bedrock's theme folder
	# with the name specified as the argument after "init".
	# By default the dev-master version of Sage will
	# be used.
  elif [ "$1" == "init" ]; then
    shift 1
    mkdir src
    $COMPOSE run --rm $TTY \
        -w /var/www/html \
        app \
        composer create-project roots/bedrock .
    $COMPOSE run --rm $TTY \
        -w /var/www/html/web/app/themes \
        app \
        composer create-project roots/sage $1 dev-master

  # Else, pass-thru args to docker-compose
  else
    $COMPOSE "$@"
  fi
else
  $COMPOSE ps
fi
```

Whew… That’s a lot of stuff going on. Let’s break it down and talk about the important bits.

### Setting the environment variables
```
# Set environment variables for dev
export APP_PORT=${APP_PORT:-80}
export DB_HOST=${DB_HOST:-mysql}
export DB_PORT=${DB_PORT:-3306}
export DB_ROOT_PASS=${DB_ROOT_PASS:=secret}
export DB_NAME=${DB_NAME:=wordpress}
export DB_USER=${DB_USER:=wordpress}
export DB_PASS=${DB_PASS:=secret}
```

Here we’re specifying sensible defaults for the dev environment, but these defaults will be overridden if you have environment variables set already for each of these values.

### Starting the dev environment
Running the develop script with no arguments like this `./develop` is simply an alias for `docker-compose ps` using the default development configuration.

#### Initializing Bedrock and Sage
To start a new development environment it’s recommended to first run the `init` command:
```
# if "init" is used, make the src directory and
# install latest version of Bedrock. Afterwards
# install a Sage theme into Bedrock's theme folder
# with the name specified as the argument after "init".
# By default the dev-master version of Sage will
# be used.
elif [ "$1" == "init" ]; then
shift 1
mkdir src
$COMPOSE run --rm $TTY \
    -w /var/www/html \
    app \
    composer create-project roots/bedrock .
$COMPOSE run --rm $TTY \
    -w /var/www/html/web/app/themes \
    app \
    composer create-project roots/sage $1 dev-master
```

There’s a lot going on there, but it’s really quite simple once we break it down. First the init command will create the `src/` directory and start an instance of the app container which has access to Composer and execute `composer create-project roots/bedrock .` which installs the latest version of Roots.io’s Bedrock into the `src/` directory.

Next the init command runs `composer create-project roots/sage $1 dev-master` in an instance of the app container with a different working directory to install the latest dev-master version of Roots.io’s Sage starter theme to `src/web/app/themes/` in a folder based on the argument passed to the init command. For instance `./develop init my-theme` would install the Sage starter theme at the path `src/web/app/themes/my-theme`. Additional metadata about the installed theme will be specified via terminal input while installing the theme.

If you wanted to lock to a specific version of Bedrock or Sage you just need to modify the composer commands in the develop script to use your preferred version of each like so:
```
elif [ "$1" == "init" ]; then
shift 1
mkdir src
$COMPOSE run --rm $TTY \
    -w /var/www/html \
    app \
    composer create-project roots/bedrock . 1.8.0
$COMPOSE run --rm $TTY \
    -w /var/www/html/web/app/themes \
    app \
    composer create-project roots/sage $1 8.5.1
```

I wouldn’t recommend setting an older version for Bedrock since staying up to date with the latest here means starting from the latest version of WordPress, however locking to a specific version of Sage can be useful since at the time of writing Sage 9.0 is still in beta.

#### Bringing the environment online
Once the `src/` directory is initialized you’re ready to start the environment. To do so I recommend running `./develop up -d` which will bring both services up in the background. To check the log output of both services you can run `./develop logs` since the develop command is essentially a wrapper for the `docker-compose` command with some extra power commands I’ll discuss next.

### Invoking Composer using the app container
```
# If "composer" is used, pass-thru to "composer"
  # inside a new container
  if [ "$1" == "composer" ]; then
      shift 1
      $COMPOSE run --rm $TTY \
          -w /var/www/html \
          app \
          composer "$@"
```

This section of the develop script enables you to run arbitrary composer commands against the Bedrock WordPress application. For example if you wanted to add a new WordPress plugin from [wpackagist](https://wpackagist.org/), like for example the popular [Contact Form 7](https://wordpress.org/plugins/contact-form-7/) plugin, you would run the following command with the develop script:
`./develop composer install "wpackagist-plugin/contact-form-7": "4.8"`

This will start a fresh instance of the app container and invoke composer from within the container to install the plugin to your Bedrock WordPress application within the `src/` directory and update `src/composer.json` with the new package dependancy.

You can run any composer command you want simply by using `./develop composer ARGUMENT` where you specify the specific command as the argument value.

### Running WP-CLI commands
```
# If "wp" is used, pass-thru to "wp-cli"
  elif [ "$1" == "wp" ]; then
      shift 1
      $COMPOSE run --rm $TTY \
          -w /var/www/html \
          app \
          wp --allow-root "$@"
```

Similarly to the composer command we have a command to run WP-CLI using our develop script. Any arguments passed to `./develop wp ARGUMENT` will be used for running WP-CLI commands. As a quick practical example here’s how you can perform the WordPress 5-minute install entirely from the command line once your dev environment is up and running:
`./develop wp core install --url="http://example.dev" --title="Example Site" --admin_user="admin" --admin_password="12341234" --admin_email="admin@example.dev"`

You can use any WP-CLI commands in this fashion so feel free to review the [WP-CLI command reference](https://developer.wordpress.org/cli/commands/) for more information on what all is available here.

## Wrapping up
So there you have it, that’s an overview of how I use Docker to run WordPress using the Roots.io approach. I’m sure this is far from perfect and if you have suggestions on how to improve it feel free to mention it in the comments below or [open an issue on the GitHub repo](https://github.com/joepurdy/DockPress/issues/new).

Cheers,
Joe
