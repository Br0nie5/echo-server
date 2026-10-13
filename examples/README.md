# Examples

One deployment of Echo per directory: a `compose.yaml` and, behind a reverse proxy, the `Caddyfile` of that proxy ([Caddy](https://caddyserver.com)). Copy the one closest to your setup, and replace its volumes, its host and its certificate with yours.

| Example                                               | Address                        | Proxy | Echo  | Shows                                                                 |
| ----------------------------------------------------- | ------------------------------ | :---: | :---: | --------------------------------------------------------------------- |
| [no-proxy-http](no-proxy-http/)                       | `http://localhost:4000/app`    |   –   | HTTP  | Echo on its own.                                                      |
| [proxy-http](proxy-http/)                             | `http://testing.cc/app`        | HTTP  | HTTP  | A proxy without TLS.                                                  |
| [proxy-https](proxy-https/)                           | `https://testing.cc/app`       | HTTPS | HTTP  | TLS ending at the proxy: the usual deployment.                        |
| [proxy-https-server-https](proxy-https-server-https/) | `https://testing.cc/app`       | HTTPS | HTTPS | TLS between the proxy and Echo too (`TLS_CERT_PATH`, `TLS_KEY_PATH`). |
| [proxy-https-subdomain](proxy-https-subdomain/)       | `https://local.testing.cc/app` | HTTPS | HTTP  | Echo on a subdomain.                                                  |
| [proxy-https-base-path](proxy-https-base-path/)       | `https://testing.cc/local/app` | HTTPS | HTTP  | Echo under a path of its domain (`BASE_PATH`).                        |

In all of them:

- the authentication and the self reports are enabled, and the Telegram notifications are not;
- `TRUSTED_PROXIES` is left unset, so Echo believes whatever proxy sends it a request. A proxy has a fixed address on the network of its example, which the commented `TRUSTED_PROXIES` line names;
- the image is the published one, `ghcr.io/br0nie5/echo:latest`, unless `ECHO_IMAGE` names another;
- the volumes are the `test_logs/`, `self_reports/` and `data/` directories at the root of this repository.

Each `compose.yaml` holds the lines to uncomment to change these settings, and its `Caddyfile` says what the proxy forwards.

## Running one from this repository

```bash
npm run start:docker                   # asks which one
npm run start:docker -- proxy-https    # or names it
```

It builds the image from the sources (`echo:dev`) and runs the example with it, in place of the published image. Ctrl+C stops the example and removes its containers.

To run one with the published image instead, start it yourself:

```bash
docker compose -f examples/proxy-https/compose.yaml up
```

Either way, put some `.jsonl` files in `test_logs/`, at the root of the repository, to have logs to look at. On Linux, `self_reports/` and `data/` must be writable by the user of the container, uid `1000`.

## The hosts

`testing.cc` and `local.testing.cc`, which the examples behind a proxy are reached at, must resolve to your machine:

```bash
npm run dns:enable     # adds them to /etc/hosts, asks for the sudo password
npm run dns:disable    # removes them
```

Only the machine running the command is concerned. To reach an example from another device, override both names in the DNS of your network instead.

## The certificate

[certs/](../certs/), at the root of the repository, holds a self-signed certificate for `testing.cc`, its subdomains and `localhost`, valid for a hundred years, which `npm run certs:generate` creates again. Your browser warns about it: accept the warning.

**Never use it outside local testing**: its private key is public.

## Adding an example

Add a directory holding a `compose.yaml`: `npm run start:docker` lists every directory that has one. Start the file with a comment saying what it shows, then its address on a line of its own, which the script prints:

```yaml
# Echo over HTTP, behind a reverse proxy serving HTTPS.
#
# URL: https://testing.cc/app
```

Give its image as `${ECHO_IMAGE:-ghcr.io/br0nie5/echo:latest}`, so the script can run it with the image it builds.
