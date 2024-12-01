// const ENDPOINT = 'http://localhost:8080'
// const ENDPOINT = 'https://7b94-129-100-255-24.ngrok-free.app/createSong'
const ENDPOINT = 'https://hackwestern11controller-88dfdd62efd5.herokuapp.com/createSong'
console.log(ENDPOINT)
const main = async () => {

    const t1 = performance.now()
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            lyrics: "Verse 1: I'm spittin' rhymes like a machine gun, Got the crowd jumpin' till the beat is done, I'm the lyricist with the golden tongue, Got the flow so smooth, make the haters stunned Chorus: Hip hop's in my blood, it's my DNA, I'mma keep rhymin' till my dying day, I'm the king of the mic, no time for play, Gonna take the crown and I'm here to stay Verse 2: I'm on top of the game, ain't no competition, Leavin' all these rappers in a bad condition, I'm the truth, no need for superstition, My bars are hard, got that ammunition Chorus: Hip hop's in my blood, it's my DNA, I'mma keep rhymin' till my dying day, I'm the king of the mic, no time for play, Gonna take the crown and I'm here to stay Bridge: From the East to the West, I'm the best in the biz, Got the whole world bumpin' to my sick beats, kid, I'm a legend in the making, watch me as I rise, Hip hop's alive and well, no need for goodbyes Outro: So remember my name when I'm gone, I'll be a hip hop icon, living on and on, My lyrics will be studied, my flow will be praised, I'm a hip hop artist, forever blazed.",
            genre: 'hiphop'
        })
    })
    const t2 = performance.now()

    console.log(await response.json())
    console.log('time taken:', t2 - t1)
}

main()
