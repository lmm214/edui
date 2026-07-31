(() => {
  function volumeGradeTag(unit) {
    if (!Number.isInteger(unit?.grade) || !unit?.semester) return '';
    return `${unit.grade}${unit.semester === '上册' ? 'a' : 'b'}`;
  }

  function recommendCourseware(unit, _knowledgeNodes = [], limit = Infinity) {
    const data = globalThis.INTERACTIVE_COURSEWARE_DATA || { items: [], recommendations: {} };
    const itemById = new Map(data.items.map(item => [item.id, item]));
    const recommendations = (data.recommendations?.[unit?.unitId] || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(recommendation => {
        const item = itemById.get(recommendation.coursewareId);
        if (!item) return null;
        return {
          ...item,
          match: {
            source: 'curated',
            note: recommendation.note || '',
            order: recommendation.order
          }
        };
      })
      .filter(Boolean);
    return Number.isFinite(limit) ? recommendations.slice(0, Math.max(0, limit)) : recommendations;
  }

  globalThis.COURSEWARE_RECOMMENDER = { recommendCourseware, volumeGradeTag };
})();

