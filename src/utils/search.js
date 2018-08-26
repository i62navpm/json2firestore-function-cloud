function getNameAndSurname(nameAndSurname = '') {
  return nameAndSurname.split(',')
}

function getPartDni(dni = '') {
  return dni.replace(/\D/gi, '')
}

function parseOpponent(opponent) {
  let { apellidosynombre, dni, ...info } = opponent
  const [nombre, apellidos] = getNameAndSurname(apellidosynombre)
  dni = getPartDni(dni)
  return { nombre, apellidos, dni, info }
}

function isSameOpponent(staticOpponent, dynamicOpponent) {
  if (
    staticOpponent.apellidos === dynamicOpponent.apellidos &&
    staticOpponent.nombre === dynamicOpponent.nombre
  ) {
    return dynamicOpponent.dni
      ? staticOpponent.dni === dynamicOpponent.dni
      : true
  }
  return false
}

function getPosition(list) {
  const mapObj = {
    assignmentList: -1,
    citationList: -2,
    default: -1,
  }

  return mapObj[list] || mapObj['default']
}

module.exports = {
  parseOpponent,
  isSameOpponent,
  getPosition,
}
