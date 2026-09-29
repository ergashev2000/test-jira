import dayjs from '@/shared/lib/dayjs';

export const day = (offset = 0) => dayjs().startOf('day').add(offset, 'day');
/** Date: 'YYYY-MM-DD' */
export const d = (offset = 0) => day(offset).format('YYYY-MM-DD');
/** Datetime ISO: dt(-1, '10:30') → yesterday 10:30 */
export const dt = (offset = 0, time = '10:00') => {
  const [h, m] = time.split(':').map(Number);
  return day(offset).hour(h).minute(m).toISOString();
};
