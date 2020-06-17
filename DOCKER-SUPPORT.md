# NodeListServer Docker Support

## Quickstart
1.	Make sure you have a recent Docker installation. I tested this on the latest official release on a Ubuntu Bionic Beaver (18.04) bare metal server. There's plenty of guides out there on how to setup containers, go read them if you haven't already got docker installed.

2.	Ensure you have a fresh copy of NodeListServer's files. See **Installation** in the [README](README.md) file.

3.	Inside the fresh copy of the repository, you will have a `DockerFile`. You can study this if you like.

4.	**CONFIGURE THE INSTANCE FIRST VIA EDITING THE CONFIG FILE**. If you change the default port, you will need to update the `Dockerfile`'s `EXPOSE` setting. Then start the build process by issuing the following on your shell:
```
docker build -t nodelistserver-docker-instance .
```

_NOTE: You may change the tag name. This is just an example._

5. Wait a bit and the docker image will be ready. Keep in mind that the docker image will contain your configuration settings at the time of building, any changes to the configuration outside of the docker image will not be acknowledged. (Do note that this would be a welcome feature to have)
```
Sending build context to Docker daemon  187.4kB
Step 1/10 : FROM node:12
[...]
Successfully built 30a7ca282a34
Successfully tagged nodelistserver-docker-instance:latest
```

6. Run the docker in the foreground to ensure it's working. You should get some output like so. If you want it running in the background, add `-d` to the `docker run` command, before the `--name` part.
```
docker run -p 8889:8889 --name nls-demo nodelistserver-docker-instance

Starting NodeListServer. Please wait...
Updating modules...
added 67 packages from 46 contributors and audited 67 packages in 1.07s
found 0 vulnerabilities

Modules and dependencies satisfied, continuing startup.
Starting the main application.
NodeListServer Gen2: Mirror List Server reimplemented in NodeJS
Report bugs and fork me on GitHub: https://github.com/SoftwareGuy/NodeListServer
Listening on HTTP port 8889!
```

**Don't forget to change the 8889:8889 part if your instance runs on a different port.** For example, if you wanted the docker to listen on port 8889, but have it connectable on a different port, you could do `31337:8889` which would make port 31337 map to the docker instance's 8889 port. It is very handy if you want to have many NodeListServer instances running, but don't want to edit the config file for every one.

7. To stop the container, open a new shell and issue `docker stop name-of-container`. It may take a few seconds for the container to shut off.

8. From then on, you can now just use `docker start nls-demo` to boot your NodeListServer instance.

## Am I dreaming? Is it really that easy?
Of course it is! I did the hard work of writing this guide so you didn't have to!

## I've got a problem following these steps...
Open a ticket and tell me what happened. Give me all the info I'd need, such as your host (ie. Google, Azure, Amazon, Vultr, Linode), your server specifications, the host operating system, and any diagnostic output provided.