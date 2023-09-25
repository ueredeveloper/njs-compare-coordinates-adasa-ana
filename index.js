const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');


// creating a new function to use async / await syntax
const readFile = async (name, filePath) => {

  const fileContent = await new Promise((resolve, reject) => {
    return fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(JSON.parse(data));
    });
  });
  // printing the file content
  if (name === "snirh") {

    let registros = []
    fileContent.forEach(fc => {
      fc.registros.forEach(_fc => { registros.push(_fc) })

    })
    //subterrâneo let registro = fileContent[2].registros[900];

    return { name: "snirh", registros: registros }
  } else {

    return { name: "adasa", registros: fileContent }
  }


}

(async () => {
  /*let filePaths = {
    read: 'json/manual.json',
    write: 'json/manual-compare.json'
  }*/

  /*let filePaths = {
    read: 'json/tubular.json',
    write: 'json/tubular-compare.json'
  }*/
  let filePaths = {
    read: 'json/superficial.json',
    write: 'json/superficial-compare.json'
  }
  let adasaResult = await readFile('adasa', filePaths.read);
  const filePathSNIRH = path.resolve(__dirname, 'json/snirh-grants.json');
  let anaResult = await readFile('snirh', filePathSNIRH);

  function calculateDistanceInMeters(coord1, coord2) {
    const point1 = turf.point(coord1);
    const point2 = turf.point(coord2);
    return turf.distance(point1, point2, { units: 'meters' });
  }
  function pointStringToArray(pointString) {
    // Remove "POINT(" and ")" from the string
    const cleanedString = pointString.replace("POINT(", "").replace(")", "");

    // Split the string into latitude and longitude components
    const [longitude, latitude] = cleanedString.split(" ").map(Number);

    // Return the coordinates as an array
    return [longitude, latitude];
  }

  let compareResult = []

  adasaResult.registros.forEach((adasaRes, i) => {

    let results = anaResult.registros.filter(anaRes => {
      let anaLatLng = [anaRes.longitude, anaRes.latitude];
      let adasaLatLng = pointStringToArray(adasaRes.int_shape);
      let meters = calculateDistanceInMeters(anaLatLng, adasaLatLng)
      anaRes.meters = parseFloat(meters);
      /*
      * Duas comparações: proximidade e tipo de interferência, se superficial ou subterrâneo
      */
      return meters < 20.0 && adasaRes.ti_id === anaRes.idSubTipoInterferencia
    });
    if (results.length===0) {

      compareResult.push({
        ana_distancia_metros: null,
        ana_id_interferencia: null,
        ana_processo: null,
        ana_tipo_ato: null,
        ana_numero_ato: null,
        ana_nome_empr: null,
        ana_responsavel: null,
        ana_cpf_cnpj: null,
        ...adasaRes
      })
    }
    if (results.length === 1) {
      let result = results[0];
      compareResult.push({
        ana_distancia_metros: parseFloat(result.meters),
        ana_id_interferencia: result.idInterferencia,
        ana_processo: result.processo,
        ana_tipo_ato: result.tipoAto,
        ana_numero_ato: result.numeroAto,
        ana_nome_empr: result.nomeEmpreendimento,
        ana_responsavel: result.responsavel,
        ana_cpf_cnpj: result.cpfCnpj,
        ...adasaRes
      })
    }
    if (results.length > 1) {
      let result = results.find(obj => {
        return obj.meters === Math.min(...results.map(result => result.meters)
        )
      })
      compareResult.push({
        ana_distancia_metros: parseFloat(result.meters),
        ana_id_interferencia: result.idInterferencia,
        ana_processo: result.processo,
        ana_tipo_ato: result.tipoAto,
        ana_numero_ato: result.numeroAto,
        ana_nome_empr: result.nomeEmpreendimento,
        ana_responsavel: result.responsavel,
        ana_cpf_cnpj: result.cpfCnpj,
        ...adasaRes
      })
    }
  });

  try {
    fs.writeFileSync(filePaths.write, JSON.stringify(compareResult), (err) => {
      if (err) throw err;
    })
  } catch (e) {
    console.log(e)
  }

})();