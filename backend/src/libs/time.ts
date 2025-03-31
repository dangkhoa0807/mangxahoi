const getUTCTime = (dateTimeString: any) => {
  const dt = new Date(dateTimeString);
  const dtNumber = dt.getTime();
  const dtOffset = dt.getTimezoneOffset() * 60000;
  const dtUTC = new Date();
  dtUTC.setTime(dtNumber - dtOffset);

  return dtUTC;
};

export { getUTCTime };
