#!/usr/bin/env bash
# Domain availability probe for the StateReady naming pass.
# `dig` is not installed in this container, so DNS resolution goes through python3's
# socket.gethostbyname; HTTP status comes from curl -sI (headers only, no body fetched).
# Nothing is registered or purchased by this script. Re-run to refresh the evidence.
set -u
DOMAINS="${*:-stateready.com stateready.io stateready.app stateready.co getstateready.com
  licensecalendar.com licensecalendar.io licencecalendar.com
  permitready.com permitready.io permitready.app
  statecert.com statecert.io statecertify.com
  tradelicense.com truckroll.com
  readyroster.com readyroster.io readyroster.app
  crossstate.com crossstate.io crossstate.app
  atlasready.com licenseatlas.com licenseatlas.io licenseatlas.app
  wagelens.com certly.com clausewright.com}"
printf '%-26s %-18s %-10s %s\n' DOMAIN A-RECORD HTTP FINAL-URL
for d in $DOMAINS; do
  ip=$(python3 - "$d" <<'PY'
import socket,sys
try: print(socket.gethostbyname(sys.argv[1]))
except Exception: print("NXDOMAIN")
PY
)
  if [ "$ip" = "NXDOMAIN" ]; then
    printf '%-26s %-18s %-10s %s\n' "$d" "$ip" "-" "unregistered or no A record"
    continue
  fi
  out=$(curl -sI -L --max-time 25 -o /dev/null -w '%{http_code} %{url_effective}' "https://$d/" 2>/dev/null || echo "ERR -")
  printf '%-26s %-18s %-10s %s\n' "$d" "$ip" "${out%% *}" "${out#* }"
done
