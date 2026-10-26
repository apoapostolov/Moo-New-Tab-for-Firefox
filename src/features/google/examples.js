/** Lines shown in the empty title box: the box is the whole form, so one dimmed sentence teaches
 * the syntax. Each entry is a phrasing natural.js handles, covering a distinct shape. */

export const EVENT_EXAMPLES = [
  'Dentist on 24th oct at 9 for 45 minutes',
  'Lunch with Ana on friday at 13:00 at Made in Blue',
  'Sprint review in 3 days at 14:00 for 1 hour',
  'Flight to Berlin on 12 nov at 06:45 at Sofia airport',
  'Weekly review every monday at 17:00',
  'Holiday 24 dec to 3 jan',
  'Call the landlord tomorrow at 10',
  'Physio next tuesday at 8:30am for 40 minutes',
  'Team offsite 3-5 dec at the office',
  'Board meeting on the 1st of december at 15:00 for 2 hours',
  'Yoga every wednesday at 7pm',
  'Standup every weekday at 9:15 for 15 minutes',
  'Interview with Kalin on 9 nov at 11:30 for 30 minutes at Sofia Tech Park',
  'Budget review in 2 weeks at 10:00',
  'Project kickoff on 30 oct at 9 for 90 minutes at the Sofia office',
  'Piano lesson every tuesday at 18:30 for 45 minutes',
  'Coffee with Maria on saturday at 10 at Fabrika',
  'Conference 20-22 nov at Inter Expo Center',
  'Rent due on 1 dec at 9',
  'Dinner with the neighbours on 14 nov at 19:30 for 3 hours',
];

export const TASK_EXAMPLES = [
  'Call the plumber tomorrow',
  'Pay the electricity bill on the 5th',
  'Buy milk and eggs today',
  'Renew the passport in 3 weeks',
  'Send the invoice on friday',
  'Book the dentist in 2 days',
  'Return the parcel by 12 nov',
  'Draft the report next monday',
  'Order printer paper in 10 days',
  'Cancel the gym membership on 1 dec',
  'Fix the kitchen tap on saturday',
  'Email the landlord about the radiator',
  'Pick up the parcel from the post office tomorrow',
  'Check the car insurance on 15 jan',
  'Buy a present for Ana on 20 dec',
  'Submit the tax return on 30 apr',
  'Clean the balcony on sunday',
  'Call mum today',
  'Back up the laptop next sunday',
  'Water the plants in 4 days',
];

/** One example for this dialog, chosen fresh each time it opens. */
export const examplePlaceholder = (kind = 'event') => {
  const list = kind === 'task' ? TASK_EXAMPLES : EVENT_EXAMPLES;

  return list[Math.floor(Math.random() * list.length)];
};
