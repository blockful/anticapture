const isNotAgentSkill = (f) => !f.includes("/.agents/");

module.exports = {
  "*.{js,jsx,ts,tsx}": (files) => {
    const filtered = files.filter(isNotAgentSkill);
    return filtered.length ? [`eslint --fix ${filtered.join(" ")}`] : [];
  },
  "*.{json,md,yml,yaml}": (files) => {
    const filtered = files.filter(isNotAgentSkill);
    return filtered.length ? [`prettier --write ${filtered.join(" ")}`] : [];
  },
};
