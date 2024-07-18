
import 'dotenv/config'


export default async function fetchDaisy(query) {

	const endpoint = process.env.DAISY_CMS_ENDPOINT
    const token = process.env.DAISY_CMS_TOKEN

	if (!endpoint) 
		throw new Error("Missing DAISY_CMS_ENDPOINT in .env")

	if (!token) 
		throw new Error("Missing DAISY_CMS_TOKEN in .env")

	const response = await fetch(endpoint, {
		method: 'POST',
		body: JSON.stringify({ query }),
		headers: { 
			"Content-Type": "application/json", 
			"Authorization": `Bearer ${token}`,
		},
	})

	if (response.status !== 200)
		throw new Error(`Error fetching from Daisy CMS: ${response.statusText}`)

	const responseJson = await response.json()

	return responseJson.data
}
