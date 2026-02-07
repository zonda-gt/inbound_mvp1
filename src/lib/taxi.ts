export function generateAmapTaxiLink(destination: {
  name: string;
  lat: string;
  lng: string;
  chineseName?: string;
}) {
  const dname = destination.chineseName || destination.name;

  const appLink = `amapuri://route/plan/?dlat=${destination.lat}&dlon=${destination.lng}&dname=${encodeURIComponent(dname)}&dev=0&t=0`;

  const webLink = `https://uri.amap.com/navigation?to=${destination.lng},${destination.lat},${encodeURIComponent(dname)}&mode=car&callnative=1`;

  return { appLink, webLink };
}
