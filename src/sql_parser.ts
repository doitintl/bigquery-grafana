export default class SqlParser {
  static getProjectDatasetTableFromSql = (sqlCode: string) => {
    const FULL_JOB_ID = SqlParser.getFullJobId(sqlCode);
    const DATASET = SqlParser.getDatasetId(FULL_JOB_ID);
    const PROJECT = SqlParser.getProjectIdFromFullId(FULL_JOB_ID);
    const TABLE = SqlParser.getTableId(FULL_JOB_ID);

    return [PROJECT, DATASET, TABLE];
  };

  private static getFullJobId = (sqlCode: string) => {
    let fullJobId = ``;
    if (sqlCode) {
      const jobIdRegExp = /from\s{0,}[\S]{1,}|from\s[\S]{2,}/gi;
      let matchId = sqlCode.match(jobIdRegExp);

      if (matchId && Array.isArray(matchId)) {
        //The from part
        matchId.forEach((match) => {
          fullJobId = match.replace(/from|\n|;/gi, ' ').trim(); //remove from, newlines, spaces & ;
          if (fullJobId.match(/`|\[|\.|:/)) {
            fullJobId = fullJobId.replace(/`|\[|\]/g, '');
          }
        });
      }
    }
    return fullJobId;
  };

  private static getDatasetId = (fullStringId: string) => {
    const tableIdObj = SqlParser.isStandardSql(fullStringId);
    let datasetId = '';
    if (!tableIdObj.isStandard) {
      //if is legacy
      let colonSplit = fullStringId.split(':');
      let dotsCount = colonSplit.length;
      datasetId = colonSplit[dotsCount - 1].split('.')[0];
    } else {
      //proj:e.ct.dataset.table
      let dotsSplit = fullStringId.split('.');
      let dotsCount = dotsSplit.length;
      if (dotsCount > 2) {
        datasetId = dotsSplit[dotsCount - 2];
      } else {
        //might be proxy "use"
        datasetId = dotsSplit[dotsCount - 1];
      }
      if (fullStringId.toLowerCase().includes('.information_schema')) {
        if (dotsCount === 4) {
          datasetId = dotsSplit[1];
        }
        if (dotsCount === 3) {
          datasetId = dotsSplit[0];
        }
      }
    }
    datasetId = datasetId.replace(/`|\[|\]/g, '');
    return datasetId;
  };

  private static isStandardSql = (idString: string) => {
    let isStandard,
      fullId,
      partialId,
      projectId = '';
    // This 'if' checks if the provided idString is of type standard and makes sure there is only one ':' in the expression (as in legacy syntax)
    const splitted = idString.split(/[:.]|:\./g);
    if (splitted.length > 3) {
      const __ret = SqlParser.try2findProjectId(idString, projectId);
      idString = __ret.idString;
      projectId = __ret.projectId;
    }
    if (idString.match(/:/g)) {
      // Regex that checks if the format of the id match legacy
      let matched = idString.match(/([\[]([^[]|[\[][\]])*[\]])|[:.]/g);
      if (matched && matched[0]) {
        if (matched[0] === ':' && matched[1] === '.') {
          fullId = idString; //.replace(/:/, '.');
        } else {
          fullId = projectId + matched[0].substring(1, idString.length - 1);
        }
        isStandard = false;
      } else {
        SqlParser.errorMessage('First Regex', idString, '');
      }
      // Same as the first only that here instead of ':' we are looking for '.' and we want to make sure there is more than 1 (as in standard syntax)
    } else if (idString.match(/\./g) && idString.match(/\./g)?.length === 2) {
      // Regex that checks if the format of the id match standard
      let matched = idString.match(/(`([^`]|``)*`)/g); // ? idString.match(/(`([^`]|``)*`)/g) : [idString];
      if (matched && matched[0]) {
        fullId = projectId + matched[0].substring(1, idString.length - 1);
        isStandard = true;
      } else if (!matched && idString) {
        fullId = projectId + idString;
        isStandard = true;
      } else {
        SqlParser.errorMessage('Second Regex', idString, '');
      }
    } else {
      //projectID.dataset
      // In case of id without projectId of proxy "use" project.dataset
      if (splitted.length === 2) {
        fullId = '';
        if (idString[0] === '[' && idString[idString.length - 1] === ']') {
          isStandard = false;
        } else if (idString[0] === '`' && idString[idString.length - 1] === '`') {
          isStandard = true;
        }
        partialId = idString.replace(/`|\[|\]/g, '');
      }
    }
    // Return values is flag the determine the type (standard or legacy) and id without staring/ ending chars (``, [])
    return {
      isStandard,
      fullId: fullId,
      partialId: partialId,
    };
  };

  private static try2findProjectId = (idString: string, projectId: string) => {
    let numOfInstances = 0;
    for (let i = idString.length; i > 0; i--) {
      const char = idString[i - 1];
      if (char === ':' || char === '.') {
        numOfInstances++;
        if (numOfInstances === 2) {
          projectId = idString[0] === `\`` ? idString.substring(1, i - 1) : idString.substring(0, i - 1);
          idString = idString.substring(i - 1, idString.length);
          idString = idString[idString.length - 1] === '`' ? '`' + idString : idString;
          idString = idString[idString.length - 1] === ']' ? '[' + idString : idString;
        }
      }
    }
    return { idString, projectId };
  };

  private static errorMessage = (location: string, idString: string, message: string) => {
    const MESSAGE = message ? message : `Id is not valid and not related to either legacy nor standard. id:`;
    throw `${location} ${MESSAGE} ${idString}`;
  };

  private static getProjectIdFromFullId = (fullStringId: string) => {
    if (fullStringId === undefined || fullStringId.length === 0) {
      return '';
    }
    let projectFound;
    const splittedProject = fullStringId.split(/[.:]/g);
    if (splittedProject.length > 3) {
      let numOfInstances = 0;
      for (let i = fullStringId.length; i > 0; i--) {
        const char = fullStringId[i - 1];
        if (char === '.' || char === ':') {
          numOfInstances++;
          if (numOfInstances === 2) {
            projectFound = fullStringId.substring(0, i - 1).replace(/[[`]/g, '');
            if (fullStringId.toLowerCase().includes('.information_schema')) {
              projectFound = splittedProject[0];
            }
          }
        }
      }
    } else {
      if (!fullStringId.toLowerCase().includes('.information_schema')) {
        projectFound = splittedProject[0].replace(/[[`]/g, '');
      }
    }
    return projectFound;
  };

  private static getTableId = (fullStringId: string) => {
    const tableIdObj = SqlParser.isStandardSql(fullStringId);
    let table = tableIdObj.fullId;
    if (tableIdObj.fullId && tableIdObj.fullId.toString().indexOf('.') > -1) {
      const splittedId = tableIdObj.fullId.split('.');
      if (tableIdObj.fullId.toLowerCase().includes('.information_schema')) {
        table = `${splittedId[splittedId.length - 2]}.${splittedId[splittedId.length - 1]}`;
      } else {
        table = splittedId[splittedId.length - 1];
      }
    } else if (tableIdObj.partialId && tableIdObj.partialId.indexOf('.') > -1) {
      const splittedId = tableIdObj.partialId.split('.');
      table = splittedId[splittedId.length - 1];
    }
    return table;
  };
}
