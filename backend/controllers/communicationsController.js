const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const { broadcastToPhones } = require("../services/communicationsService");

// @POST /api/communications/broadcast
// organiser broadcasts a WhatsApp message to captains of a tournament
const broadcast = async (req, res) => {
  try {
    const { tournamentId, message, recipientType, teamId } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // verify organiser owns this tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    if (tournament.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let phones = [];
    let recipientLabel = "";

    if (recipientType === "all_captains") {
      // get all approved teams and their captain phone numbers
      const teams = await Team.find({
        tournamentId,
        isWaitlisted: false,
      }).populate("captainId", "name phone");

      phones = teams
        .map((t) => t.captainId?.phone)
        .filter(Boolean);

      recipientLabel = `all ${phones.length} captains`;

    } else if (recipientType === "specific_team" && teamId) {
      // get specific team captain
      const team = await Team.findById(teamId).populate("captainId", "name phone");
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      if (team.captainId?.phone) {
        phones = [team.captainId.phone];
      }
      recipientLabel = `captain of ${team.teamName}`;
    }

    if (phones.length === 0) {
      return res.status(400).json({
        message: "No phone numbers found for selected recipients. Make sure captains have registered with phone numbers.",
      });
    }

    // format message with tournament context
    const formattedMessage = `*${tournament.name}*\n\n${message}\n\n_Sent by organiser via Sportfolio_`;

    const result = await broadcastToPhones(phones, formattedMessage);

    res.status(200).json({
      success: true,
      message: `Message sent to ${result.sent} of ${result.total} recipients`,
      result,
      recipientLabel,
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/communications/teams/:tournamentId
// get all teams for recipient selection
const getTeamsForBroadcast = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    if (tournament.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const teams = await Team.find({
      tournamentId: req.params.tournamentId,
      isWaitlisted: false,
    }).populate("captainId", "name phone email");

    res.status(200).json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { broadcast, getTeamsForBroadcast };