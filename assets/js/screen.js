$(document).ready(function(){
    const SerialPort = require('serialport');
    const Readline = require('@serialport/parser-readline');
    const path = '/dev/tty.wchusbserial410';
    const port = new SerialPort(path, { baudRate: 9600 });
    const parser = new Readline();
    const axios = require('axios');
    const fs = require('fs');

    let rawdata = fs.readFileSync('assets/js/main.json');
    let settings = JSON.parse(rawdata);

    port.pipe(parser);
    
    port.open(err => {
         if(err){
             return console.log('Error Opening Port:', err.message)
         }
    });
    
    parser.on('data', line => {
        axios.post(settings.url + 'rfid', {
                id: line.trim()
            })
            .then((res) => {
                var img = res.data.data.img_path;
                var path = (img == '' ? 'https://img.icons8.com/material/100/000000/user-female-circle.png' : settings.base + res.data.data.img_path);
                $('#full').addClass('d-none');
                $('#full').removeClass('d-block');
                setTimeout(function timeout(){
                    $('#full').removeClass('d-none');
                    $('#full').addClass('d-block');


                    $('#name-screen').text('');
                    $('#course').text('');
                    $('#in').text('');
                    $('#out').text('');
                    $('#p-img-wrapper').attr('src', 'https://img.icons8.com/material/100/000000/user-female-circle.png');
                },3000);

                $('#name-screen').text(res.data.data.f_name);
                $('#course').text(res.data.data.course);
                $('#in').text(res.data.data.log_in);
                $('#out').text(res.data.data.log_out);
                $('#p-img-wrapper').attr('src', path);
                console.log(res.data.data);
            })
            .catch((error) => {
                console.log(error);
            }
        );
    });
        
});
