export function get(url: string) {
  return fetch(url)
    .then(res => res.json(), error => {console.log(error)})
    .catch(error => console.log(error))
}
