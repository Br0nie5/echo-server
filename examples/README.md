# Examples

One deployment of Echo per directory, each with its `compose.yaml` and, behind a reverse proxy, the `Caddyfile` of that proxy ([Caddy](https://caddyserver.com)). Copy the one closest to your setup and replace its volumes, its host and its certificate with yours.

| Example                                               | Address                        | Proxy | Echo  | Shows                                                               |
| ----------------------------------------------------- | ------------------------------ | :---: | :---: | ------------------------------------------------------------------- |
| [no-proxy-http](no-proxy-http/)                       | `http://localhost:4000/app`    |   –   | HTTP  | Echo on its own                                                     |
| [proxy-http](proxy-http/)                             | `http://testing.cc/app`        | HTTP  | HTTP  | A proxy without TLS                                                 |
| [proxy-https](proxy-https/)                           | `https://testing.cc/app`       | HTTPS | HTTP  | TLS ending at the proxy, the usual deployment                       |
| [proxy-https-server-https](proxy-https-server-https/) | `https://testing.cc/app`       | HTTPS | HTTPS | TLS between the proxy and Echo too (`TLS_CERT_PATH`,`TLS_KEY_PATH`) |
| [proxy-https-subdomain](proxy-https-subdomain/)       | `https://local.testing.cc/app` | HTTPS | HTTP  | Echo on a subdomain                                                 |
| [proxy-https-base-path](proxy-https-base-path/)       | `https://testing.cc/local/app` | HTTPS | HTTP  | Echo under a path of its domain (`BASE_PATH`)                       |

In all of them, the authentication and the self reports are enabled, the Telegram notifications are not, and `TRUSTED_PROXIES` is left unset, so Echo believes whatever proxy sends it a request. Each `compose.yaml` holds the lines to uncomment to change that.

## Running one from this repository

```bash
npm run start:docker                   # asks which one
npm run start:docker -- proxy-https    # or names it
```

It builds the image from the sources and runs the example with it, in place of the published image, on `test_logs/`, `server_logs/` and `data/` at the root of the repository. Ctrl+C stops the example and removes its containers.

## The hosts

`testing.cc` and `local.testing.cc` must resolve to your machine:

```bash
npm run dns:enable     # adds them to /etc/hosts, asks for the sudo password
npm run dns:disable    # removes them
```

Only the machine running the command is concerned. To reach an example from another device, override both names in the DNS of your network instead.

## The certificate

[certs/](../certs/), at the root of the repository, holds a self-signed certificate for `testing.cc`, its subdomains and `localhost`, valid for a hundred years, which `npm run certs:generate` creates again. Your browser warns about it: accept the warning. **Never use it outside local testing**: its private key is public.
