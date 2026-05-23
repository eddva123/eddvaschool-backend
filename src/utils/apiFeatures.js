class APIFeatures {
  constructor(queryStr, queryString) {
    this.queryStr = queryStr;
    this.queryString = queryString;
    this.params = [];
    this.paramCount = 1;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let filterStr = '';
    Object.keys(queryObj).forEach((key) => {
      if (filterStr) filterStr += ' AND ';
      filterStr += `${key} = $${this.paramCount}`;
      this.params.push(queryObj[key]);
      this.paramCount++;
    });

    if (filterStr) {
      this.queryStr = this.queryStr.includes('WHERE')
        ? `${this.queryStr} AND ${filterStr}`
        : `${this.queryStr} WHERE ${filterStr}`;
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.queryStr = `${this.queryStr} ORDER BY ${sortBy}`;
    } else {
      this.queryStr = `${this.queryStr} ORDER BY created_at DESC`;
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.queryStr = `${this.queryStr} LIMIT $${this.paramCount} OFFSET $${this.paramCount + 1}`;
    this.params.push(limit, skip);
    this.paramCount += 2;
    return this;
  }
}

export default APIFeatures;
