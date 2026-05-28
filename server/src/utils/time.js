import dayjs from 'dayjs';
export const nowISO = () => dayjs().toISOString();
export const secondsSince = (iso) => dayjs().diff(dayjs(iso), 'second');
