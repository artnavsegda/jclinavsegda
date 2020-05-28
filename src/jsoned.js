const json_clean = function(data) {
	switch(typeof data) {
		case 'string':
			data = data.replace(/,[ \t\r\n]+}/g, '}')
			data = data.replace(/,[ \t\r\n]+\]/g, ']')
			data = JSON.parse(data)
			break
		case 'number':
		case 'boolean':
			return undefined
	}
	return data
}

export {json_clean}
