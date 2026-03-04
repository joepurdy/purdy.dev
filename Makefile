default: run

help:		## list out commands with descriptions
	@sed -ne '/@sed/!s/## //p' $(MAKEFILE_LIST)

run:		## start Astro dev server
	@npx astro dev --port 1313

build:		## production build
	@npx astro build

preview:	## preview production build
	@npx astro preview --port 1313

clean:		## remove generated files
	rm -rf dist .astro

post:		## create a new post (make post slug=my-slug)
	@echo '---' > src/content/posts/$(slug).md
	@echo 'title: ""' >> src/content/posts/$(slug).md
	@echo "date: $$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> src/content/posts/$(slug).md
	@echo 'author: "Joe Purdy"' >> src/content/posts/$(slug).md
	@echo 'description: ""' >> src/content/posts/$(slug).md
	@echo 'slug: ""' >> src/content/posts/$(slug).md
	@echo 'tags: []' >> src/content/posts/$(slug).md
	@echo '---' >> src/content/posts/$(slug).md
	@echo "Created src/content/posts/$(slug).md"
