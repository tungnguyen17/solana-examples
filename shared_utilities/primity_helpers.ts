import numeral from 'numeral'

export class NumericHelper {
  static formatBalance(balance: number, decimals: number)
  : string {
    const division = Math.pow(10, decimals)
    return numeral(balance / division).format('0,0.000000')
  }
}

export class StringHelper {
  static asBase64ToJson(base64: string): string {
    return Buffer.from(base64, 'base64').toString()
  }

  static asJsonToBase64(json: string): string {
    const obj = JSON.parse(json)
    const minimizedJson = JSON.stringify(obj, null, 0)
    return Buffer.from(minimizedJson).toString('base64')
  }

  static isNullOrEmpty(str: string)
  : boolean {
    if (typeof str === 'undefined' || str === null || str.length === 0) {
      return true
    }
    return false
  }
}
