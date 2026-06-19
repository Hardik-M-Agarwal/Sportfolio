const Tournament = require("../models/Tournament");

const autoUpdateStatus = async (tournament) => {
  const now = new Date();
  let newStatus = tournament.status;

  if (now < new Date(tournament.registrationStartDate)) {
    newStatus = "upcoming";
  } else if (
    now >= new Date(tournament.registrationStartDate) &&
    now <= new Date(tournament.registrationEndDate)
  ) {
    newStatus = "registration";
  } else if (
    now > new Date(tournament.registrationEndDate) &&
    now < new Date(tournament.startDate)
  ) {
    newStatus = "upcoming";
  } else if (
    now >= new Date(tournament.startDate) &&
    now <= new Date(tournament.endDate)
  ) {
    newStatus = "ongoing";
  } else if (now > new Date(tournament.endDate)) {
    newStatus = "completed";
  }

  if (newStatus !== tournament.status) {
    await Tournament.findByIdAndUpdate(tournament._id, { status: newStatus });
    tournament.status = newStatus;
  }

  return tournament;
};

module.exports = { autoUpdateStatus };