// ── KNOCKOUT ──────────────────────────────────────────────────────────
const generateKnockout = (teams) => {
  const matches = [];
  let matchNumber = 1;
  let round = 1;

  const shuffled = [...teams].sort(() => Math.random() - 0.5);

  let size = 1;
  while (size < shuffled.length) size *= 2;
  const padded = [...shuffled];
  while (padded.length < size) padded.push(null);

  let currentRound = padded;
  const totalRounds = Math.log2(size);

  const getRoundName = (round, totalRounds) => {
    const remaining = totalRounds - round + 1;
    if (remaining === 1) return "Final";
    if (remaining === 2) return "Semi Final";
    if (remaining === 3) return "Quarter Final";
    return `Round ${round}`;
  };

  while (currentRound.length > 1) {
    const nextRound = [];
    const roundName = getRoundName(round, totalRounds);

    for (let i = 0; i < currentRound.length; i += 2) {
      const team1 = currentRound[i];
      const team2 = currentRound[i + 1];

      if (team1 && team2 && team1 !== "TBD" && team2 !== "TBD") {
        matches.push({
          round,
          roundName,
          matchNumber: matchNumber++,
          team1Id: team1._id,
          team2Id: team2._id,
        });
      }
      nextRound.push("TBD");
    }

    currentRound = nextRound;
    round++;
  }

  return matches;
};

// ── LEAGUE (ROUND ROBIN) ─────────────────────────────────────────────
const generateLeague = (teams) => {
  const matches = [];
  let matchNumber = 1;

  const teamList = [...teams];
  if (teamList.length % 2 !== 0) teamList.push(null);

  const totalTeams = teamList.length;
  const totalRounds = totalTeams - 1;
  const matchesPerRound = totalTeams / 2;

  for (let round = 1; round <= totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const team1 = teamList[match];
      const team2 = teamList[totalTeams - 1 - match];

      if (team1 && team2) {
        matches.push({
          round,
          roundName: `League Round ${round}`,
          matchNumber: matchNumber++,
          team1Id: team1._id,
          team2Id: team2._id,
          group: null,
        });
      }
    }

    const last = teamList.splice(totalTeams - 1, 1)[0];
    teamList.splice(1, 0, last);
  }

  return matches;
};

// ── LEAGUE + KNOCKOUT ─────────────────────────────────────────────────
const generateLeagueKnockout = (teams) => {
  const matches = [];
  let matchNumber = 1;

  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const mid = Math.ceil(shuffled.length / 2);
  const groupA = shuffled.slice(0, mid);
  const groupB = shuffled.slice(mid);

  const generateGroupMatches = (groupTeams, groupName, startRound) => {
    const groupMatches = [];
    const teamList = [...groupTeams];
    if (teamList.length % 2 !== 0) teamList.push(null);

    const totalTeams = teamList.length;
    const totalRounds = totalTeams - 1;
    const matchesPerRound = totalTeams / 2;

    for (let round = 0; round < totalRounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        const team1 = teamList[match];
        const team2 = teamList[totalTeams - 1 - match];

        if (team1 && team2) {
          groupMatches.push({
            round: startRound + round,
            roundName: `Group ${groupName} - Round ${round + 1}`,
            matchNumber: matchNumber++,
            team1Id: team1._id,
            team2Id: team2._id,
            group: groupName,
          });
        }
      }

      const last = teamList.splice(totalTeams - 1, 1)[0];
      teamList.splice(1, 0, last);
    }

    return groupMatches;
  };

  const groupAMatches = generateGroupMatches(groupA, "A", 1);
  const groupBMatches = generateGroupMatches(groupB, "B", 1);
  matches.push(...groupAMatches, ...groupBMatches);

  const maxGroupRound = Math.max(
    ...groupAMatches.map((m) => m.round),
    ...groupBMatches.map((m) => m.round),
    0
  );

  const sfRound = maxGroupRound + 1;

  // Semi finals — top 2 from each group
  // Using first 2 teams from each group as placeholders
  matches.push(
    {
      round: sfRound,
      roundName: "Semi Final 1",
      matchNumber: matchNumber++,
      team1Id: groupA[0]._id,
      team2Id: groupB[1] ? groupB[1]._id : groupB[0]._id,
      group: null,
    },
    {
      round: sfRound,
      roundName: "Semi Final 2",
      matchNumber: matchNumber++,
      team1Id: groupB[0]._id,
      team2Id: groupA[1] ? groupA[1]._id : groupA[0]._id,
      group: null,
    },
    {
      round: sfRound + 1,
      roundName: "Final",
      matchNumber: matchNumber++,
      team1Id: groupA[0]._id,
      team2Id: groupB[0]._id,
      group: null,
    }
  );

  return matches;
};

module.exports = { generateKnockout, generateLeague, generateLeagueKnockout };