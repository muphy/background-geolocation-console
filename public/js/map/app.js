$(function () {

    $('#table').bootstrapTable({
        url: 'http://128.199.248.88:8080/locations?start_date=2015-11-22&end_date=2015-11-30',
        toggle: "table",
        pagination: true,
        search: true,
        height: 760,
        pageNumber: 1,
        pageSize:10,
        showPaginationSwitch: true,
        locale:'eu-US',
        columns: [
            {
                field: 'id',
                title: 'id'
            }, {
                field: 'uuid',
                title: 'UUID'
            }, {
                field: 'device_id',
                title: '스마트폰고유키'
            },{
                field: 'device_model',
                title: '스마트폰모델명',
            }, {
                field: 'latitude',
                title: '위도'
            }, {
                field: 'longitude',
                title: '경도'
            },
            // {
            //     field: 'accuracy',
            //     title: '정확도'
            // }, 
            {
                field: 'altitude',
                title: '고도'
            }, 
            {
                field: 'speed',
                title: '속도'
            },
            // {
            //     field: 'heading',
            //     title: 'heading'
            // }, 
            {
                field: 'activity_type',
                title: '활동 유형'
            }, 
            // {
            //     field: 'activity_confidence',
            //     title: 'activity_confidence'
            // }, 
            {
                field: 'battery_level',
                title: '남은배터리'
            }, {
                field: 'battery_is_charging',
                title: '배터리충전중'
            }, {
                field: 'is_moving',
                title: '움직임'
            }, {
                field: 'recorded_at',
                title: '저장 시간'
            }, {
                field: 'created_at',
                title: '입력시간'
            }
        ]
    });

});




