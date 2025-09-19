import moment from 'moment-timezone';

export const addDays = (days: number) => {
  return moment().add(days, 'days').toDate();
};
