Read data from MaxSky Hybrid MPPT from solar of things for display on Home Assistant

<p float="center">
<img src="https://github.com/X-c0d3/solar-of-things-hack/blob/main/doc/image3.jpg"  width="ุ600">

1. Create .env file

```
BASE_URL=https://solar.siseli.com

ACCOUNT=<USERNAME>
PASSWORD=<PASSWORD>

APP_ID=<APP_ID>
OPEN_APP_SECRET=<OPEN_APP_SECRET>

DEVICE_ID=<DEVICE_ID>
TIMEZONE=Asia/Bangkok
```

after you loged solar.siseli.com you have to get deviceID from URL querystring or from api reposeponse
https://solar.siseli.com/apis/device/details?deviceId=<DEVICE_ID>
and find 'stationId' on the response

<img src="https://github.com/X-c0d3/solar-of-things-hack/blob/main/doc/image1.jpg"  width="ุ600">

APP_ID and OPEN_APP_SECRET you can find on javascript file via ChromDevTools
https://solar.siseli.com/umi.0dddcf2d.js (It's random javascript files)
open DevTools and search with 'openAppSecret'

<img src="https://github.com/X-c0d3/solar-of-things-hack/blob/main/doc/image2.jpg"  width="ุ600">

</p>
