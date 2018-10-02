function getNameAndSurname(nameAndSurname = '') {
  const [apellidos = '', nombre = ''] = nameAndSurname.split(',')
  return [apellidos.trim(), nombre.trim()]
}

function getPartDni(dni = '') {
  return dni.replace(/\D/gi, '')
}

function parseOpponent(opponent) {
  let { apellidosynombre, dni, ...info } = opponent
  const [apellidos, nombre] = getNameAndSurname(apellidosynombre)
  dni = getPartDni(dni)
  return { apellidos, nombre, dni, info }
}

function isSameOpponent(staticOpponent, dynamicOpponent) {
  if (
    staticOpponent.apellidos.includes(dynamicOpponent.apellidos) &&
    staticOpponent.nombre.includes(dynamicOpponent.nombre)
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
    voluntaryListDynamic: -3,
    nextCitationList: -4,
    default: -1,
  }

  return mapObj[list] || mapObj['default']
}

module.exports = {
  parseOpponent,
  isSameOpponent,
  getPosition,
}
