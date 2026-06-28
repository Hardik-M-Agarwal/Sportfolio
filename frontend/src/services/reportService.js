import api from './api';

const triggerDownload = (blob, filename) => {
  const url  = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const reportService = {
  async downloadFinancialSummary(tournamentId, tournamentName) {
    const res = await api.get(`/reports/tournament/${tournamentId}/financial`, {
      responseType: 'blob',
    });
    triggerDownload(res.data, `financial-summary-${tournamentName.replace(/\s+/g, '-')}.pdf`);
  },

  async downloadTeamPerformance(tournamentId, tournamentName, teamId = null) {
    const url = teamId
      ? `/reports/tournament/${tournamentId}/teams?teamId=${teamId}`
      : `/reports/tournament/${tournamentId}/teams`;
    const res = await api.get(url, { responseType: 'blob' });
    triggerDownload(res.data, `team-performance-${tournamentName.replace(/\s+/g, '-')}.pdf`);
  },

  async downloadSponsorImpact(tournamentId, sponsorshipId, tournamentName) {
    const res = await api.get(
      `/reports/tournament/${tournamentId}/sponsor/${sponsorshipId}`,
      { responseType: 'blob' }
    );
    triggerDownload(res.data, `sponsor-impact-${tournamentName.replace(/\s+/g, '-')}.pdf`);
  },
};

export default reportService;