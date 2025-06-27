export function extractBookInfo(data, extra = {}) {
  const {
    title = '',
    price = '',
    availability = '',
    image = ''
  } = data;

  return {
    title,
    price,
    availability,
    image,
    ...extra
  };
}
