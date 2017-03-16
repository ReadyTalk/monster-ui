define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var portWizard = {

		// Defines API requests not included in the SDK
		requests: {
		},

		// Define the events available for other apps
		subscribe: {
			'common.portWizard.render': 'portWizardRenderPortInfo'
		},

		portWizardRenderPortInfo: function(args) {
			var self = this,
				container = args.container,
				template = $(self.getTemplate({
					name: 'portInfo',
					submodule: 'portWizard'
				}));

			container
				.empty()
				.append(template);

			container
				.find('#name')
					.focus();

			args.data = {
				request: {
					numbers: {}
				}
			};

			self.portWizardBindPortInfoEvents(args);
		},

		portWizardBindPortInfoEvents: function(args) {
			var self = this,
				container = args.container,
				billFileData;

			container
				.find('.numbers-type')
					.on('change', function(event) {
						event.preventDefault();

						var template;

						if (container.find('.bill-upload-wrapper').is(':empty')) {
							template = $(self.getTemplate({
								name: 'portInfo-billUpload',
								submodule: 'portWizard'
							})).css('display', 'none');

							template
								.find('#bill_input')
									.fileUpload({
										btnClass: 'monster-button-primary',
										inputOnly: true,
										success: function(results) {
											var actionsTemplate = $(self.getTemplate({
												name: 'portInfo-actions',
												submodule: 'portWizard'
											})).css('display', 'none');

											if (container.find('.portInfo-success').length < 1) {
												billFileData = results[0];

												container
													.find('.actions')
														.prepend(actionsTemplate);

												container
													.find('.portInfo-success')
														.fadeIn();
											}
										}
									});

							container
								.find('.bill-upload-wrapper')
									.append(template);

							container
								.find('.bill-upload')
									.fadeIn();
						}
					});

			container
				.on('click', '.portInfo-success', function(event) {
					event.preventDefault();

					var $form = container.find('#form_port_info'),
						formData = monster.ui.getFormData('form_port_info');

					monster.ui.validate($form, {
						rules: {
							name: {
								required: true,
								minlength: 1,
								maxlength: 128
							},
							'extra.type': {
								required: true
							}
						}
					});

					if (monster.ui.valid($form)) {
						$.extend(true, args.data.request, formData, {
							extra: {
								billFileData: billFileData
							}
						});

						self.portWizardRenderAccountVerification(args);
					}
				});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log('cancel');
					});
		},

		portWizardRenderAccountVerification: function(args) {
			var self = this,
				container = args.container,
				template = $(self.getTemplate({
					name: 'accountVerification',
					submodule: 'portWizard'
				}));

			monster.ui.renderPDF(args.data.request.extra.billFileData.file, template.find('.pdf-container'));

			container
				.empty()
				.append(template);

			self.portWizardBindAccountVerificationEvents(args);
		},

		portWizardBindAccountVerificationEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('.next')
					.on('click', function(event) {
						event.preventDefault();

						var $form = container.find('#form_account_verification'),
							formData = monster.ui.getFormData('form_account_verification');

						monster.ui.validate($form, {
							rules: {
								'bill.name': {
									minlength: 1,
									maxlength: 128
								},
								'bill.steet_address': {
									minlength: 1,
									maxlength: 128
								},
								'bill.locality': {
									minlength: 1,
									maxlength: 128
								},
								'bill.region': {
									minlength: 2,
									maxlength: 2
								},
								'bill.postal_code': {
									digits: true,
									minlength: 5,
									maxlength: 5
								},
								validation: {
									required: true
								}
							}
						});

						if (monster.ui.valid($form)) {
							$.extend(true, args.data.request, {
								bill: formData.bill
							});

							self.portWizardRenderAddNumbers(args);
						}
					});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log('cancel');
					});
		},

		portWizardRenderAddNumbers: function(args) {
			var self = this,
				container = args.container,
				dataToTemplate = $.extend(true, args.data, {
					request: {
						extra: {
							numbers_count: _.keys(args.data.request.numbers).length
						}
					}
				}),
				template = $(self.getTemplate({
					name: 'addNumbers',
					data: dataToTemplate,
					submodule: 'portWizard'
				}));

			monster.ui.renderPDF(args.data.request.extra.billFileData.file, template.find('.pdf-container'));

			container
				.empty()
				.append(template);

			self.portWizardBindAddNumbersEvents(args);
		},

		portWizardBindAddNumbersEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('.add-numbers')
					.on('click', function(event) {
						event.preventDefault();

						var $form = container.find('#form_add_numbers'),
							formData = monster.ui.getFormData('form_add_numbers'),
							newNumbers;

						monster.ui.validate($form, {
							rules: {
								numbers: {
									required: true
								}
							}
						});

						if (monster.ui.valid($form)) {
							newNumbers = formData.numbers.split(' ').reduce(function(object, number) {
								object[monster.util.unformatPhoneNumber(monster.util.formatPhoneNumber(number), 'keepPlus')] = {};
								return object;
							}, {});

							self.portWizardRenderAddNumbers($.extend(true, args, {
								data: {
									request: {
										numbers: newNumbers
									}
								}
							}));
						}
					});

			container
				.find('.remove')
					.on('click', function(event) {
						event.preventDefault();

						var number = $(this).parents('.item').data('number');

						delete args.data.request.numbers[number];

						self.portWizardRenderAddNumbers(args);
					});

			container
				.find('.next')
					.on('click', function(event) {
						event.preventDefault();

						var sign = $(this).data('sign');

						if (sign === 'manual') {
							self.portWizardRenderUploadForm(args);
						}
					});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log('cancel');
					});
		},

		portWizardRenderUploadForm: function(args) {
			var self = this,
				container = args.container,
				formType = args.data.request.extra.type === 'local' ? 'loa' : 'resporg',
				dataToTemplate = {
					type: self.i18n.active().portRequestWizard.uploadForm.type[formType],
					link: monster.config.whitelabel.port[formType]
				},
				template = $(self.getTemplate({
					name: 'uploadForm',
					data: dataToTemplate,
					submodule: 'portWizard'
				}));

			template
				.find('#form_input')
					.fileUpload({
						btnClass: 'monster-button-primary',
						inputOnly: true,
						success: function(results) {
							var actionsTemplate = $(self.getTemplate({
								name: 'uploadForm-actions',
								submodule: 'portWizard'
							})).css('display', 'none');

							if (template.find('.uploadForm-success').length < 1) {
								args.data.request.extra.formFileData = results[0];

								template
									.find('.actions')
										.prepend(actionsTemplate);

								template
									.find('.uploadForm-success')
										.fadeIn();
							}
						}
					});

			container
				.empty()
				.append(template);

			self.portWizardBindUploadFormEvents(args);
		},

		portWizardBindUploadFormEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.on('click', '.uploadForm-success', function(event) {
					event.preventDefault();

					console.log(args.data.request);
				});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log(args.data.request);
					});
		}
	};

	return portWizard;
});
