#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo 'Run this script as root.' >&2
  exit 1
fi

artifact=${1:?artifact path required}
checksum_file=${2:?checksum file path required}
version=${3:?release version required}
site_root=/www/wwwroot/easvue.624work.club
release_dir=${site_root}/releases/${version}
node_bin=/opt/easvue/node-v24.18.1/bin

case "${artifact}" in
  /tmp/easvue-*|/home/lisdeploy/easvue-*) ;;
  *) echo 'Artifact must be an explicitly named EasVue file in /tmp or /home/lisdeploy.' >&2; exit 1 ;;
esac

[[ -f "${artifact}" && -f "${checksum_file}" ]]
[[ ! -e "${release_dir}" ]]
(cd "$(dirname "${artifact}")" && sha256sum --check "$(basename "${checksum_file}")")

install -d -o root -g root -m 0755 "${release_dir}"
tar -xzf "${artifact}" -C "${release_dir}"
cd "${release_dir}/server"
NODE_GYP_FORCE_PYTHON=/usr/local/bin/python3.12 PATH="${node_bin}:${PATH}" \
  "${node_bin}/npm" ci --omit=dev --no-audit --no-fund

native_module_dir="${release_dir}/server/node_modules/better-sqlite3"
if [[ ! -f "${native_module_dir}/build/Release/better_sqlite3.node" ]]; then
  node_gyp="${node_bin}/../lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js"
  cd "${native_module_dir}"
  NODE_GYP_FORCE_PYTHON=/usr/local/bin/python3.12 PATH="${node_bin}:${PATH}" \
    "${node_bin}/node" "${node_gyp}" rebuild --release --force_build=1
fi
rm -f -- "${native_module_dir}/prebuilds/linux-x64.node"
cd "${release_dir}/server"
PATH="${node_bin}:${PATH}" "${node_bin}/node" -e \
  "const D=require('better-sqlite3'); const d=new D(':memory:'); d.prepare('select 1').get(); d.close()"
chown -R root:root "${release_dir}"
find "${release_dir}" -type d -exec chmod 0755 {} +
find "${release_dir}" -type f -exec chmod 0644 {} +

ln -sfn "${release_dir}" "${site_root}/current.next"
mv -Tf "${site_root}/current.next" "${site_root}/current"

install -o root -g root -m 0644 "${release_dir}/deploy/easvue-api.service" /etc/systemd/system/easvue-api.service
install -o root -g root -m 0644 "${release_dir}/deploy/easvue-backup.service" /etc/systemd/system/easvue-backup.service
install -o root -g root -m 0644 "${release_dir}/deploy/easvue-backup.timer" /etc/systemd/system/easvue-backup.timer
systemctl daemon-reload
systemctl enable easvue-api.service easvue-backup.timer
systemctl restart easvue-api.service
systemctl start easvue-backup.timer
for attempt in {1..15}; do
  if curl --fail --silent http://127.0.0.1:8787/api/health >/dev/null; then
    break
  fi
  if [[ ${attempt} -eq 15 ]]; then
    echo 'EasVue loopback health check did not become ready in time.' >&2
    exit 1
  fi
  sleep 2
done

echo "Release ${version} is active and its loopback health check passed."
