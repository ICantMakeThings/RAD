# [Website](https://rad.icmt.cc/)

# [Documentation](https://icmt.cc/p/rad-the-local-radiaton-website/)

# Note! If you have a spare GM tube and esp8266, maybe you want to set it up on my server and on my site users can switch from one location to another?

# How to Start:

* Initialize the database: Run `npm run db:init` to create the database tables.
* Sync live data: Run `npm run db:seed` to fetch the latest readings from [rad.icmt.cc](https://rad.icmt.cc/).
* Start the server: Run `npm run dev` to launch the local worker.
* View the site: Open [http://localhost:8787](http://localhost:8787).
