#!/bin/bash
cd /var/www/barber-demo
export $(cat .env | xargs)
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/send-reminders.ts