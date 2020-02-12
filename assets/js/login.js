const remote = require('electron').remote;
const session = require('electron').remote.session;
const Window = remote.BrowserWindow;
const fs = require('fs');
var ses = session.fromPartition('persist:name');

$(document).ready(function(){
    let rawdata = fs.readFileSync('assets/js/main.json');
    let settings = JSON.parse(rawdata);

    $.validator.setDefaults({
        highlight: function (element) {
            $(element).closest('.form-control').addClass('is-invalid');
        },
        unhighlight: function (element) {
            $(element).closest('.form-control').removeClass('is-invalid');
            $(element).closest('.form-control').addClass('is-valid');
        },
        errorElement: 'div',
        errorClass: 'invalid-feedback',
        errorPlacement: function (error, element) {
            if (element.parent('.input-group-prepend').length) {
                $(element).siblings(".invalid-feedback").append(error);
                //error.insertAfter(element.parent());
            } else {
                error.insertAfter(element);
            }
        },

    });


    $('#lgform').validate({
        rules: {
            usr: {
                required: true,
                normalizer: function(value) {
                    return $.trim(value);
                }
            },
            pwd: {
                required: true,
                minlength: 8,
                normalizer: function(value) {
                    return value;
                }
            }
        },
        messages: {
            usr : "Username field is required",
            pwd: {
                required: 'Password field is required',
                minlength: $.validator.format("At least 8 characters required!")
            }
        },
        submitHandler: function(form) {
            
            $.ajax({
                url: settings.url + 'auth',
                type: 'POST',
                data: $(form).find("input[name!=submit]").serialize(),
                error: function (xhr, ajaxOptions, thrownError){
                    var error = xhr.responseJSON.message;

                    $('#errorHeader').text(thrownError);
                    $('#errorMsg').text((typeof(error) == 'object' ?  error[Object.keys(error)[0]] : error));
                    $('#exampleModalCenter').modal('toggle');
                    $('#userEmail').prop('disabled', false);
                    $('#userPwd').prop('disabled', false);
                    $('#userEmail').val('');
                    $('#userPwd').val('');
                    $('#userEmail').removeClass('is-valid');
                    $('#userPwd').removeClass('is-valid ');
                },
                beforeSend: function(xhr){
                    $('#userEmail').prop('disabled', true);
                    $('#userPwd').prop('disabled', true);
                },  
                success: function(data){
                    var date = new Date();
                    date.setDate(date.getDate() + 7);

                    ses.cookies.set({
                        name: 'access_token',
                        value: data.token,
                        path: '',
                        httpOnly: true,
                        expirationDate: date,
                        url: settings.url + '/api/v1.0/auth'
                    }).then(() => {
                        const win = new Window({
                            height: 720,
                            width: 1080,
                            frame: false,
                            webPreferences: {
                                nodeIntegration: true
                            },
                            resizable: false,
                            titleBarStyle: 'hiddenInset',
                            frame: false
                        });
                
                        win.webContents.openDevTools();
                        win.loadFile('pages/main.html');
                        remote.getCurrentWindow().close();
                        win.setMenuBarVisibility(false);
                        win.webContents.openDevTools();
                    }, (error) => {
                    });
                },
            });
        },  
    });

});