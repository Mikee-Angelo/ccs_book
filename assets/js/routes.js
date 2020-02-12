var app = angular.module('Main', [
    'ngRoute',
    'ngResource', 
    'datatables', 
    'datatables.bootstrap', 
    'datatables.buttons', 
    'ngFileUpload',
    'angular-js-xlsx'
]);

const fs = require('fs');
const session = require('electron').remote.session;
var usbDetect = require('usb-detection');
var XLSX = require('xlsx');
var remote = require('electron').remote;
var Window = remote.BrowserWindow;
var ses = session.fromPartition('persist:name');


let rawdata = fs.readFileSync('assets/js/main.json');
let settings = JSON.parse(rawdata);
app.config(['$routeProvider', 

function($routeProvider){
    $routeProvider
    .when('/', {
        templateUrl: 'dashboard.html',
    })
    .when('/import', {
        templateUrl: 'import.html'
    })
    .when('/manage', {
        templateUrl: 'manage.html'
    })
    .when('/add', {
        templateUrl: 'add.html'
    })
    .when('/edit', {
        templateUrl: 'edit.html'
    })
    .when('/sat', {
        templateUrl: 'student.html'
    })
    .when('/activity', {
        templateUrl: 'activity.html'
    })
    .when('/password', {
        templateUrl: 'pwd.html'
    })
    .when('/logout', {
        controller : 'LogoOut'
    })
}]);

app.controller('DashTable', DashTable);
app.controller('ImportField', ImportField);
app.controller('ImportTable', ImportTable);
app.controller('DashTable', DashTable);
app.controller('ManageTable', ManageTable);
app.controller('SATable', SATable);
app.controller('ActivityTable', ActivityTable);
app.controller('LogOut', LogOut);
app.controller('Edit', Edit);
app.controller('Add', Add);

app.factory('importService', function($rootScope){
    var list = {};
    
    list.data = [];

    list.prepforBroadCast = function(obj){
        this.data = obj;
        this.broadcastItem();
    }

    list.broadcastItem = function(){
        $rootScope.$broadcast('dataHandler');
    }

    return list;
});

app.factory('editService', function($rootScope){
    var savedData = {};
    
    function set(data){
        savedData = data ;
    }

    function get(){
        return savedData;
    }

    return {
        set: set,
        get: get,
    }
});

app.directive('customOnChange', function() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var onChangeHandler = scope.$eval(attrs.customOnChange);
        element.on('change', onChangeHandler);
        element.on('$destroy', function() {
          element.off();
        });
  
      }
    };
});

function DashTable($scope, $q,  $interval, $http, DTOptionsBuilder, DTColumnBuilder) {
    var vm = this;

    vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        
        var defer = $q.defer();

        //GETTING SESSION COOKIE AND ADD TO HEADER
        ses.cookies.get({}).then((cookies) => {
            //HTTP GET REQUEST
           $http({
                method: 'GET',
                url: settings.url + '/dashboard',
                headers: {
                    'Authorization': cookies[cookies.length - 1].value
                }
            }).then((res) => {
                defer.resolve(res.data.data);
            });
            
        });

        return defer.promise;
    })
    .withOption('stateSave', true)
    .withOption("retrieve", true)
    .withOption('scrollY', '300px');;
    //COLUMN OF TABLE
    vm.dtColumns = [
        DTColumnBuilder.newColumn('id').withTitle('ID'),
        DTColumnBuilder.newColumn('name').withTitle('First name'),
        DTColumnBuilder.newColumn('course').withTitle('Course'),
        DTColumnBuilder.newColumn('in').withTitle('In'),
        DTColumnBuilder.newColumn('out').withTitle('Out'),
    ];

    vm.dtInstance = {};

    $interval(
        function() {
            var resetPaging = false;
            vm.dtInstance.reloadData(() => {}, resetPaging);
        }, 10000
    );

    $scope.screen = function(){
        usbDetect.startMonitoring();
        usbDetect.find(function(err, devices) { console.log('find', devices, err); });
        // const win = new Window({
        //     fullscreen: true,
        //     frame: false,
        //     webPreferences: {
        //         nodeIntegration: true
        //     },
        //     resizable: false,
        //     frame: true,
        //     titleBarStyle: 'hiddenInset'
        // });

        // win.webContents.openDevTools();
        // win.loadFile('pages/screen.html');
        // win.setMenuBarVisibility(false);
    }

}

function ImportTable($scope, $resource, importService, DTOptionsBuilder, DTColumnDefBuilder) {
    var vm = this;

    //vm.persons = $resource('data1.json').query();
    vm.dtOptions = DTOptionsBuilder.newOptions()
    .withOption('scrollY', '300px');;
    vm.dtColumnDefs = [
        DTColumnDefBuilder.newColumnDef(0),
        DTColumnDefBuilder.newColumnDef(1),
        DTColumnDefBuilder.newColumnDef(2),
    ];

    $scope.$on('dataHandler', function(){
        $scope.persons = (importService.data == undefined ? [] : importService.data);
        console.log(importService.data);
    });
    // $scope.$watch('testGet', function(data){
    //     console.log(data);
    // });
}


function ImportField($scope, $window, importService){
    $scope.SelectFile = function (file) {
        $scope.SelectedFile = file;
    };

    $scope.Upload = function (e) {
        var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xls|.xlsx)$/;
        console.log(e.target.files[0]);
        if (regex.test(e.target.files[0].name.toLowerCase())) {
            if (typeof (FileReader) != "undefined") {
                var reader = new FileReader();
                //For Browsers other than IE.
                if (reader.readAsBinaryString) {
                    reader.onload = function (e) {
                        $scope.ProcessExcel(e.target.result);
                    };
                    reader.readAsBinaryString(e.target.files[0]);
                } else {
                    //For IE Browser.
                    reader.onload = function (e) {
                        var data = "";
                        var bytes = new Uint8Array(e.target.result);
                        for (var i = 0; i < bytes.byteLength; i++) {
                            data += String.fromCharCode(bytes[i]);
                        }
                        $scope.ProcessExcel(data);
                    };
                    reader.readAsArrayBuffer(e.target.files[0]);
                }
            } else {
                $window.alert("This browser does not support HTML5.");
            }
        } else {
            $window.alert("Please upload a valid Excel file.");
        }
    };

    $scope.ProcessExcel = function (data) {
        //Read the Excel File data.
        var workbook = XLSX.read(data, {
            type: 'binary'
        });

        //Fetch the name of First Sheet.
        var firstSheet = workbook.SheetNames[0];

        //Read all rows from First Sheet into an JSON array.
        var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[firstSheet]);
        //Display the data from Excel file in Table.
        $scope.$apply(function () {
            $scope.Customers = excelRows;
            $scope.IsVisible = true;
            
        });
    };

    $scope.$watch('Customers', function(data) {
        importService.prepforBroadCast(data);
    });

    $scope.SubmitExcel = function() {

        ses.cookies.get({}).then((cookies) => {
            //HTTP GET REQUEST

            if(importService.data != undefined){
                
                angular.forEach(importService.data, function(value, key){
                    delete value.$$hashKey;

                });

                $.ajax({
                    url: settings.url + '/import',
                    type: 'POST',
                    headers: {
                        'Authorization': cookies[cookies.length-1].value,
                    },
                    dataType: 'json',
                    data: {
                        'data' : importService.data
                    },
                    success: function(data){
                        importService.prepforBroadCast(undefined);
                        
                    },
                    error: function(err){
                        console.log(err)
                    }
                });
            }else{
                importService.prepforBroadCast(undefined);
            }
            
        });

    }
}

function ManageTable($location, $compile, $q, $http, $scope, $resource, DTOptionsBuilder, DTColumnBuilder, editService){
    var vm = this;
    
    vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        
        ses.cookies.get({}).then((cookies) => {
            //HTTP GET REQUEST
           $http({
                method: 'GET',
                url: settings.url + '/manage',
                headers: {
                    'Authorization': cookies[cookies.length-1].value
                }

            }).then((res) => {
                defer.resolve((res.data.data == undefined ? '' : res.data.data));   
            });
            
        });

        return defer.promise;

    })
    .withOption('scrollY', '300px')
    .withOption('rowCallback', rowCallback);

    vm.dtColumns = [
        DTColumnBuilder.newColumn('rfid').withTitle('RFID'),
        DTColumnBuilder.newColumn('img_path').withTitle('Profile')
        .renderWith(function(data,type, full, meta  ){
            return (data == '' ? '' : '<img src="'+ data +'" class="w-100"/>');
        })
        .withClass('td-fix'),
        DTColumnBuilder.newColumn('id_num').withTitle('ID Number'),
        DTColumnBuilder.newColumn('f_name').withTitle('Name'),
        DTColumnBuilder.newColumn('course').withTitle('Course'),
        DTColumnBuilder.newColumn('date_added').withTitle('Date Added'),
        DTColumnBuilder.newColumn('student_id').withTitle('Actions')
        .renderWith(function(data,type, full, meta  ){
            var edit = '<button class="btn btn-warning btn-sm mr-1" id="edit"><i class="fas fa-edit"></i></button>';
            var del = '<button class="btn btn-danger btn-sm" id="delete"><i class="fas fa-trash"></i></button>';


            return edit + del ;
        }),
    ];

    function rowCallback(nRow, aData, iDisplayIndex, iDisplayIndexFull){
        $('td #delete', nRow).unbind('click');

        $('td #delete', nRow).bind('click', function() {
            $scope.$apply(function() {

                ses.cookies.get({}).then((cookies) => {
                    //HTTP GET REQUEST
                   $http({
                        method: 'GET',
                        url: settings.url + '/manage/delete?id=' + aData.student_id,
                        headers: {
                            'Authorization': cookies[cookies.length-1].value
                        },
                        
                    }).then((res) => {
                        vm.dtInstance.reloadData(() => {}, false);
                    }, (err) => {

                    });
                    
                });
            });
        });

        $('td #edit', nRow).bind('click', function(){
            $scope.$apply(function(){

                $scope.id = aData.student_id;

                $scope.$watch('id', function(data){
                    editService.set(data);

                    $location.path( "/edit" );
                });
            });
        });
        return nRow;
    }

    vm.dtInstance = {};

}

function SATable($http, $q, $resource, DTOptionsBuilder, DTColumnBuilder){
    var vm = this;
    
    vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        
        var defer = $q.defer();
        
        ses.cookies.get({}).then((cookies) => {
            //HTTP GET REQUEST
        console.log(cookies);
           $http({
                method: 'GET',
                url: settings.url + '/activity/student',
                headers: {
                    'Authorization': cookies[cookies.length-1].value
                }

            }).then((res) => {
                defer.resolve(res.data.data);
            });
            
        });

        return defer.promise;

    })
    .withOption('stateSave', false)
    .withOption("retrieve", true)
    .withOption('scrollY', '300px')
    .withOption('order', ['2', 'desc']);

    vm.dtColumns = [
        DTColumnBuilder.newColumn('activity_id').withTitle('Activity ID').notVisible(),
        DTColumnBuilder.newColumn('message').withTitle('Message'),
        DTColumnBuilder.newColumn('date_created').withTitle('Date Created'),
    ];
}

function ActivityTable($q, $http, $resource, DTOptionsBuilder, DTColumnBuilder){
    var vm = this;
    vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        
        var defer = $q.defer();
        
        ses.cookies.get({}).then((cookies) => {
            //HTTP GET REQUEST
        console.log(cookies);
           $http({
                method: 'GET',
                url: settings.url + '/activity/admin',
                headers: {
                    'Authorization': cookies[cookies.length-1].value
                }

            }).then((res) => {
                defer.resolve(res.data.data);
            });
            
        });

        return defer.promise;
       

    })
    .withOption('stateSave', false)
    .withOption("retrieve", true)
    .withOption('scrollY', '300px')
    .withOption('order', ['2', 'desc']);

    vm.dtInstance = {}

    vm.dtColumns = [
        DTColumnBuilder.newColumn('al_id').withTitle('ID').notVisible(),
        DTColumnBuilder.newColumn('message').withTitle('Message'),
        DTColumnBuilder.newColumn('al_date_created').withTitle('Date Created'),
    ];
   
}

function LogOut($scope){
    $scope.Logout = function(){
        session.defaultSession.clearStorageData([], (data) => {});
        let win = new Window({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true
            },
            resizable: false,
            frame: false,
            titleBarStyle: 'hiddenInset'
        });

        win.webContents.openDevTools();
        win.loadFile('index.html');
        remote.getCurrentWindow().close();
        win.setMenuBarVisibility(false);
        win.webContents.openDevTools();        
    }
}

function Add($scope, editService, $http){
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

    $('#addfrm').validate({
        rules: {
            rfid: {
                required: true,
                number: true,
                normalizer: function(value) {
                    return $.trim(value);
                }
            },
            course: {
                required: true,
                normalizer: function(value) {
                    return $.trim(value);
                }
            },
            idnum: {
                required:true,
                normalizer: function(value) {
                    return value;
                }
            },
            fname: {
                required: true,
                normalizer: function(value) {
                    return value;
                }
            },
            img_upload:{
                required : false,
                accept: "image/*"
            }
        },
        messages: {
            rfid : {
                required: 'RFID Field is required',
            },
            idnum : {
                required: "ID Number Field is required",
            },
            course: {
                required: "Course Field is required"
            },
            fname : {
                required: "Name Field is required"
            },
        },
        submitHandler: function(form){
            ses.cookies.get({}).then((cookies) => {
                var fd = new FormData();
                var file_data = $('input[type="file"]')[0].files;
                var other_data = $(form).serializeArray();

                fd.append('img_upload', file_data[0]);
                $.each(other_data,function(key,input){
                    fd.append(input.name,input.value);
                });

                $.ajax({
                    url: settings.url + '/manage',
                    type: 'POST',
                    headers: {
                        'Authorization': cookies[cookies.length-1].value,
                    },
                    enctype: 'multipart/form-data',
                    processData: false,  // Important!
                    contentType: false,
                    data: fd,
                    success: function(data){
                        console.log(data);
                    },
                    error: function(err){
                        console.log(err)
                    }
                });
            });
        }
    });
}

function Edit($scope, editService, $http){
    $scope.okay = editService.get();

    $scope.$watch('okay', (data) => {

        if(typeof(data) == 'string'){
            localStorage.setItem('edit_id', data);
            
        }

        ses.cookies.get({}).then((cookies) => {
            //HTTP GET REQUEST
            $http({
                method: 'GET',
                url: settings.url + '/manage?id=' + localStorage.getItem('edit_id'), 
                headers: {
                    'Authorization': cookies[cookies.length-1].value
                }
            }).then((data) =>{
                $scope.datas = data.data.data[0];
                console.log(data.data.data[0]);
            },(err) => {
                console.log(err);
            });
        });
    });

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

    $('#editfrm').validate({
        rules: {
            rfid: {
                required: true,
                number: true,
                normalizer: function(value) {
                    return $.trim(value);
                }
            },
            course: {
                required: true,
                normalizer: function(value) {
                    return $.trim(value);
                }
            },
            idnum: {
                required:true,
                normalizer: function(value) {
                    return value;
                }
            },
            fname: {
                required: true,
                normalizer: function(value) {
                    return value;
                }
            },
            img_upload:{
                required : false,
                accept: "image/*"
            }
        },
        messages: {
            rfid : {
                required: 'RFID Field is required',
            },
            idnum : {
                required: "ID Number Field is required",
            },
            course: {
                required: "Course Field is required"
            },
            fname : {
                required: "Name Field is required"
            },
        },
        submitHandler: function(form){
            ses.cookies.get({}).then((cookies) => {
                var fd = new FormData();
                var file_data = $('input[type="file"]')[0].files;
                var other_data = $(form).serializeArray();

                fd.append('img_upload', file_data[0]);
                $.each(other_data,function(key,input){
                    fd.append(input.name,input.value);
                });
                
                $.ajax({
                    url: settings.url + '/manage/update/' + localStorage.getItem('edit_id'),
                    type: 'POST',
                    headers: {
                        'Authorization': cookies[cookies.length-1].value,  
                    },
                    enctype: 'multipart/form-data',
                    processData: false,  // Important!
                    contentType: false,
                    data: fd,
                    success: function(data){
                        console.log(data);
                    },
                    error: function(err){
                        console.log(err)
                    }
                });
            });
        }
    });
}
